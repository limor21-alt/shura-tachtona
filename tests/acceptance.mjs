// PHASE 6 — Acceptance test suite.
//
// Runs all 20 acceptance scenarios from the product spec end-to-end
// through the real pipeline (extractFacts → classify → gate →
// applyAnswers → buildReportModel → writeCopy fallback). Each scenario
// asserts on report_model fields, not on rendered HTML.
//
// Plus regression tests:
//   R1 — row trimmer preserves salary rows past index 300
//   R2 — typo guard: "כעגע" in copy is rejected → fallback used
//   R3 — one-time labels never carry /חודש tokens

import { runPipeline } from "../supabase/functions/super-service/pipeline.ts";
import { extractFacts } from "../supabase/functions/super-service/extract_facts.ts";
import { classify } from "../supabase/functions/super-service/classify/index.ts";
import { validateClaudeCopy, validateCopy } from "../supabase/functions/super-service/validators/forbidden_words.ts";

// ---------- runner ----------
let pass = 0, fail = 0;
const failures = [];
function assert(name, cond, detail = "") {
  if (cond) { pass++; }
  else      { fail++; failures.push(`  ${name}${detail ? " — " + detail : ""}`); }
}
function group(label, fn) {
  console.log(`\n${label}`);
  const before = pass + fail;
  try { return fn(); } catch (e) {
    fail++;
    failures.push(`  ${label} — exception: ${e?.message || e}`);
  } finally {
    const ran = (pass + fail) - before;
    console.log(`  (${ran} assertions)`);
  }
}

// ---------- helpers ----------
let rowCounter = 0;
const r = (source, date, desc, amount, file_id = "f1") => ({
  source, file_id, sheet: "Sheet1",
  row_index: ++rowCounter,
  date, raw_description: desc, cleaned_name: desc,
  amount, currency: "ILS", account_mask: ""
});
function resetRows() { rowCounter = 0; }

const baseCtx = (overrides = {}) => ({
  user_name: "לימור",
  household_structure: "family",
  partner_name: "ינון",
  children_names: ["נועה"],
  has_variable_income: "yes",
  has_partner_or_business_transfers: "yes",
  planned_files: ["both"],
  ...overrides
});

// ---------- helper: run two-call flow with auto-answers ----------
async function runFinal(rows, ctx, answers = []) {
  // First call. If clarification needed, supply default answers (or
  // none) and run the second call.
  let result = await runPipeline({ rows, context: ctx });
  if (result.kind === "needs_clarification") {
    result = await runPipeline({ rows, context: ctx, answers });
    if (result.kind !== "report") throw new Error(`expected report after answers, got ${result.kind}`);
  }
  return result.report_model;
}

// ====================================================================
// #1 Amdocs + משכורת × 3 months → fixed income, NO clarification
// ====================================================================
await group("#1 Amdocs salary → fixed_income, no clarification", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-03-15", "חברת חשמל", -410),
    r("credit_card", "2025-03-22", "Wolt", -120, "f2")
  ];
  const ctx = baseCtx({ partner_name: undefined }); // no partner, no Q1
  const result = await runPipeline({ rows, context: ctx });
  assert("#1.a returns report (no clarification needed)", result.kind === "report");
  if (result.kind !== "report") return;
  const m = result.report_model;
  assert("#1.b fixed income detected", m.income_model.fixed.length === 1);
  assert("#1.c fixed income labeled Amdocs", m.income_model.fixed[0]?.source_examples?.some(s => s.includes("אמדוקס")));
  assert("#1.d monthly fixed income ≈ 18420", Math.abs(m.summary.monthly_income_fixed - 18420) < 50);
});

// ====================================================================
// #2 Partner + משכורת + irregular amounts → variable, range, NOT /חודש
// ====================================================================
await group("#2 Partner variable income → range display", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-03-12", "העברה מינון שומרוני משכורת", 11500),
    r("bank", "2025-05-04", "העברה מינון שומרוני משכורת", 17500)
  ];
  const m = await runFinal(rows, baseCtx(), [
    { question_id: "q-partner-income", choice: "variable" }
  ]);
  assert("#2.a variable_income detected", m.income_model.variable.length >= 1);
  const v = m.income_model.variable[0];
  assert("#2.b range min=11500", v?.range.min === 11500);
  assert("#2.c range max=17500", v?.range.max === 17500);
  assert("#2.d months_present=2", v?.months_present === 2);
  assert("#2.e label does NOT contain /חודש", !/\/\s*חודש|לחודש|בחודש/.test(v?.label || ""));
});

// ====================================================================
// #3 Migdal / Keren / Gemel → one_time_excluded, NEVER /חודש
// ====================================================================
await group("#3 Migdal one-time → excluded, never /חודש", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-22", "מגדל קרן השתלמות פדיון", 31768)
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }), [
    { question_id: "q-large-onetime-income", choice: "one_time" }
  ]);
  assert("#3.a Migdal in one_time_excluded", m.income_model.one_time_excluded.length === 1);
  assert("#3.b not in fixed",                m.income_model.fixed.every(f => !f.source_examples.some(s => s.includes("מגדל"))));
  assert("#3.c label has no /חודש",          !/\/\s*חודש|לחודש|בחודש/.test(m.income_model.one_time_excluded[0].label));
  assert("#3.d amount=31768",                m.income_model.one_time_excluded[0].amount === 31768);
});

// ====================================================================
// #4 Electricity → household_bill, no clarification
// ====================================================================
await group("#4 Electricity → household_bill, no Q", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-03-15", "חברת חשמל", -410),
    r("bank", "2025-04-15", "חברת חשמל", -410)
  ];
  const ctx = baseCtx({ partner_name: undefined });
  const result = await runPipeline({ rows, context: ctx });
  assert("#4.a returns report without clarification", result.kind === "report");
  if (result.kind !== "report") return;
  const m = result.report_model;
  assert("#4.b חשמל in fixed_commitments", m.expense_model.fixed_commitments.some(f => /חשמל/.test(f.label)));
  assert("#4.c electricity category = חשבונות", m.expense_model.fixed_commitments.find(f => /חשמל/.test(f.label))?.category === "חשבונות");
});

// ====================================================================
// #5 MaccabiDent ₪942 once → non_blocking
// ====================================================================
await group("#5 MaccabiDent one-time small → non_blocking", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("credit_card", "2025-03-18", "מכבידנט", -942, "f2")
  ];
  const ctx = baseCtx({ partner_name: undefined });
  const result = await runPipeline({ rows, context: ctx });
  assert("#5.a returns report (not blocked)", result.kind === "report");
  if (result.kind !== "report") return;
  const m = result.report_model;
  assert("#5.b מכבידנט in non_blocking",   m.non_blocking_items.some(x => /מכבידנט/.test(x.label)));
  assert("#5.c NOT in fixed_commitments", !m.expense_model.fixed_commitments.some(x => /מכבידנט/.test(x.label)));
});

// ====================================================================
// #6 PlaySmart ₪509 once → non_blocking kids
// ====================================================================
await group("#6 PlaySmart one-time → non_blocking", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("credit_card", "2025-04-02", "PlaySmart", -509, "f2")
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }));
  assert("#6.a PlaySmart in non_blocking", m.non_blocking_items.some(x => /PlaySmart/.test(x.label)));
});

// ====================================================================
// #7 Segav Skin ₪500 once → non_blocking personal care
// ====================================================================
await group("#7 Segav Skin one-time → non_blocking", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("credit_card", "2025-04-15", "Segav Skin", -500, "f2")
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }));
  assert("#7.a Segav Skin in non_blocking", m.non_blocking_items.some(x => /Skin/.test(x.label)));
});

// ====================================================================
// #8 Wolt → flexible_spending (no moralizing)
// ====================================================================
await group("#8 Wolt → flexible_spending, calm tone", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("credit_card", "2025-03-22", "Wolt", -85, "f2"),
    r("credit_card", "2025-04-11", "Wolt", -120, "f2"),
    r("credit_card", "2025-05-08", "מסעדה אגדה", -350, "f2")
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }));
  assert("#8.a Wolt in flexible_spending", m.expense_model.flexible_spending.some(x => /Wolt/.test(x.label)));
  // No moralizing words in any of the copy
  const allCopy = [
    m.summary.headline_copy, m.summary.meaning_copy,
    ...m.work_done.bullets_copy,
    ...m.priority_checks.map(p => p.copy_blurb),
    ...m.improvement_opportunities.map(p => p.copy_blurb)
  ].join(" ");
  assert("#8.b no 'בזבוזים'", !allCopy.includes("בזבוזים"));
  assert("#8.c no 'חמור'",     !allCopy.includes("חמור"));
});

// ====================================================================
// #9 Subscriptions → review_only (no fake savings claim)
// ====================================================================
await group("#9 Subscriptions → review_only", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18420),
    r("credit_card", "2025-03-10", "Netflix", -54, "f2"),
    r("credit_card", "2025-04-10", "Netflix", -54, "f2"),
    r("credit_card", "2025-04-12", "Spotify", -22, "f2")
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }));
  assert("#9.a Netflix in review_only", m.expense_model.review_only_items.some(x => /Netflix/.test(x.label)));
  // No "פוטנציאל חיסכון עד" anywhere
  const allCopy = JSON.stringify(m);
  assert("#9.b no 'פוטנציאל חיסכון עד' claim", !/פוטנציאל\s+חיסכון\s+עד/.test(allCopy));
});

// ====================================================================
// #10 BIT / PayBox → review_only blind spot, not savings
// ====================================================================
await group("#10 BIT/PayBox → review_only, not blocking", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-03-20", "BIT העברה", -300),
    r("bank", "2025-04-20", "PayBox העברה", -440)
  ];
  const ctx = baseCtx({ partner_name: undefined });
  const result = await runPipeline({ rows, context: ctx });
  assert("#10.a no blocking question for BIT", result.kind === "report");
  if (result.kind !== "report") return;
  const m = result.report_model;
  // BIT/PayBox items land in review_only (period_total form since one-off in our fixture)
  const hasBit = m.expense_model.review_only_items.some(x => /BIT|PayBox/i.test(x.label));
  assert("#10.b BIT/PayBox in review_only", hasBit);
});

// ====================================================================
// #11 Surplus → "עודף מחושב", no "פער", no red
// ====================================================================
await group("#11 Surplus → 'עודף מחושב'", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-03-15", "חברת חשמל", -410),
    r("bank", "2025-04-15", "חברת חשמל", -410)
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }));
  assert("#11.a summary_status = surplus", m.summary_status === "surplus");
  assert("#11.b gap_label = 'עודף מחושב'", m.summary.gap_label === "עודף מחושב");
  const all = JSON.stringify(m);
  assert("#11.c no 'פער' anywhere",         !/\bפער\b/.test(all));
});

// ====================================================================
// #12 Deficit → "חוסר חודשי", no panic
// ====================================================================
await group("#12 Deficit → 'חוסר חודשי', calm", async () => {
  resetRows();
  // Build a real deficit: income 5000, expenses 7250 → gap -2250/mo.
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 5000),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 5000),
    r("bank", "2025-03-15", "חברת חשמל", -800),
    r("bank", "2025-04-15", "חברת חשמל", -800),
    r("bank", "2025-03-25", "בזק חיוב", -700),
    r("bank", "2025-04-25", "בזק חיוב", -700),
    r("bank", "2025-03-05", "הלוואה החזר", -3000),
    r("bank", "2025-04-05", "הלוואה החזר", -3000),
    r("credit_card", "2025-03-15", "סופר", -2750, "f2"),
    r("credit_card", "2025-04-15", "סופר", -2750, "f2")
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }));
  assert("#12.a summary_status = deficit", m.summary_status === "deficit");
  assert("#12.b gap_label = 'חוסר חודשי'",  m.summary.gap_label === "חוסר חודשי");
  const all = [m.summary.headline_copy, m.summary.meaning_copy].join(" ");
  // Spec-forbidden panic vocabulary (see §"LANGUAGE RULES")
  const panic = /חמור|מסוכן|מוכרחים|דורש טיפול מיידי|בזבוזים|חייבים|קחו הלוואה/;
  assert("#12.c no panic language",         !panic.test(all));
});

// ====================================================================
// #13 Variable income material → two_scenarios
// ====================================================================
await group("#13 Variable income material → two_scenarios", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-03-12", "העברה מינון שומרוני משכורת", 11500),
    r("bank", "2025-05-04", "העברה מינון שומרוני משכורת", 17500)
  ];
  const m = await runFinal(rows, baseCtx(), [
    { question_id: "q-partner-income", choice: "variable" }
  ]);
  assert("#13.a summary_status = variable_dependent", m.summary_status === "variable_dependent");
  assert("#13.b display_mode = two_scenarios",        m.display_mode === "two_scenarios");
  assert("#13.c has 2 scenarios",                     m.summary.scenarios?.length === 2);
});

// ====================================================================
// #14 "מקס חיוב" → cc_charge_in_bank, no double-count
// ====================================================================
await group("#14 CC charge in bank → excluded from expenses", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-03-30", "מקס חיוב", -4200),
    r("bank", "2025-04-30", "מקס חיוב", -4200),
    r("credit_card", "2025-03-15", "סופר ויקטורי", -1500, "f2"),
    r("credit_card", "2025-04-15", "סופר ויקטורי", -1500, "f2")
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }));
  // The bank מקס חיוב rows must NOT appear in any expense category
  const allExpenseLabels = [
    ...m.expense_model.fixed_commitments.map(x => x.label),
    ...m.expense_model.flexible_spending.map(x => x.label),
    ...m.expense_model.review_only_items.map(x => x.label),
    ...m.expense_model.debt_payments.map(x => x.label)
  ];
  assert("#14.a 'מקס חיוב' NOT in any expense category", !allExpenseLabels.some(l => /מקס חיוב/.test(l)));
  assert("#14.b appears in excluded_internal_transfers", m.expense_model.excluded_internal_transfers.some(x => /מקס/.test(x.label)));
  assert("#14.c CC dedup count = 2",                     m.work_done.cc_charges_deduplicated === 2);
  // The CC-side row (סופר) IS counted
  assert("#14.d sofer in flexible_spending",             m.expense_model.flexible_spending.some(x => /סופר/.test(x.label)));
});

// ====================================================================
// #15 Missing evidence → fallback note, no ₪0 rows
// ====================================================================
await group("#15 No evidence → no ₪0 rows", async () => {
  resetRows();
  // Build a report where no item has total=0 — verify the model
  // doesn't emit empty tables. We test the invariant indirectly.
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420)
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }));
  const allItems = [
    ...m.expense_model.fixed_commitments,
    ...m.expense_model.flexible_spending,
    ...m.expense_model.debt_payments
  ];
  assert("#15.a no zero-amount items in expense model",
    allItems.every(x => (x.monthly_amount ?? x.monthly_avg ?? 0) > 0));
});

// ====================================================================
// #16 Only credit card file → partial_credit_only
// ====================================================================
await group("#16 Only credit card → partial_credit_only", async () => {
  resetRows();
  const rows = [
    r("credit_card", "2025-03-22", "Wolt", -120, "f1"),
    r("credit_card", "2025-04-11", "Wolt", -150, "f1"),
    r("credit_card", "2025-03-15", "סופר", -1500, "f1")
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }));
  assert("#16.a report_type = partial_credit_only", m.report_type === "partial_credit_only");
  assert("#16.b no fixed income (no bank file)",    m.income_model.fixed.length === 0);
});

// ====================================================================
// #17 Only bank file → partial_bank_only
// ====================================================================
await group("#17 Only bank → partial_bank_only", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-03-15", "חברת חשמל", -410)
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }));
  assert("#17.a report_type = partial_bank_only", m.report_type === "partial_bank_only");
});

// ====================================================================
// #18 Audit trail present
// ====================================================================
await group("#18 Audit trail populated", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-03-30", "מקס חיוב", -4200)
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }));
  assert("#18.a rules_fired present", m.classification_audit_trail.rules_fired.length >= 2);
  assert("#18.b excluded_items contains CC",
    m.classification_audit_trail.excluded_items.some(x => /אשראי/.test(x.reason)));
});

// ====================================================================
// #19 Non-blocking items rendered compact at end
// ====================================================================
await group("#19 Non-blocking items at end", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("credit_card", "2025-03-18", "מכבידנט", -942, "f2"),
    r("credit_card", "2025-04-02", "PlaySmart", -509, "f2"),
    r("credit_card", "2025-04-15", "Segav Skin", -500, "f2")
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }));
  assert("#19.a non_blocking_items contains 3 items", m.non_blocking_items.length === 3);
  // Renderer order is enforced by renderer.js section sequence; here we just
  // verify the items are present and shaped correctly.
  for (const item of m.non_blocking_items) {
    assert(`#19.b nb item has amount > 0 (${item.label})`, item.amount > 0);
    assert(`#19.c nb item has suggested_category (${item.label})`, !!item.suggested_category);
  }
});

// ====================================================================
// #20 One-time labels NEVER contain /חודש
// ====================================================================
await group("#20 One-time labels — no /חודש", async () => {
  resetRows();
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-22", "מגדל קרן השתלמות פדיון", 31768),
    r("credit_card", "2025-03-18", "מכבידנט", -942, "f2"),
    r("credit_card", "2025-04-15", "Segav Skin", -500, "f2")
  ];
  const m = await runFinal(rows, baseCtx({ partner_name: undefined }), [
    { question_id: "q-large-onetime-income", choice: "one_time" }
  ]);

  const oneTimeLabels = [
    ...m.income_model.one_time_excluded.map(x => x.label),
    ...m.expense_model.one_time_expenses.map(x => x.label),
    ...m.non_blocking_items.map(x => x.label)
  ];
  const monthly = /\/\s*חודש|לחודש|בחודש/;
  for (const label of oneTimeLabels) {
    assert(`#20 label clean: "${label}"`, !monthly.test(label));
  }
});

// ====================================================================
// REGRESSION TESTS
// ====================================================================

// R1: row trimmer preserves salary keyword rows even past index 300.
await group("R1 row trimmer preserves salary past index 300", () => {
  resetRows();
  const rows = [];
  // Generate 400 noisy rows, no salary keyword
  for (let i = 0; i < 400; i++) {
    rows.push(r("bank", "2025-03-15", `Random charge #${i}`, -10));
  }
  // Inject salary at index 350 (well past the 300 floor)
  rows.push(r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18420));
  const ctx = baseCtx({ partner_name: undefined });
  const facts = extractFacts(rows, ctx);
  const salaryPresent = facts.rows.some(r =>
    r.raw_description.includes("משכורת")
  );
  assert("R1 salary row survives the trim", salaryPresent);
});

// R2: forbidden word "כעגע" in Claude output → rejected.
await group("R2 typo guard rejects 'כעגע'", () => {
  const violations = validateClaudeCopy({
    headline_copy: "כעגע אנחנו רואים שיש לכם עודף", // typo
    meaning_copy: "",
    work_done_bullets: [],
    priority_check_blurbs: [],
    improvement_blurbs: []
  });
  assert("R2 'כעגע' triggers violation", violations.length > 0);
  assert("R2 violation field is headline_copy",
    violations.some(v => v.field === "headline_copy"));
});

// R3: "פער" in surplus context is rejected.
await group("R3 forbidden word 'פער' rejected", () => {
  const v = validateCopy("יש לכם פער חודשי", "headline_copy");
  assert("R3 'פער' triggers violation", v.length > 0);
});

// R4: "/חודש" on one-time → rejected
await group("R4 /חודש on one-time rejected", () => {
  const v = validateCopy("מגדל ₪31,768 לחודש", "label", { isOneTime: true });
  assert("R4 'לחודש' on one-time rejected", v.length > 0);
});

// R5: forbidden phrase "פוטנציאל חיסכון עד" rejected
await group("R5 'פוטנציאל חיסכון עד' rejected", () => {
  const v = validateCopy("פוטנציאל חיסכון עד ₪500", "improvement");
  assert("R5 false savings claim rejected", v.length > 0);
});

// ====================================================================
// REPORT
// ====================================================================

console.log(`\n${"=".repeat(50)}`);
console.log(`Phase 6 acceptance: ${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(f);
  process.exit(1);
}
