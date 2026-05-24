// Test the new gate question for ambiguous municipal/multi-purpose
// vendors (e.g., "החברה לפיתוח גני תקווה" — could be ארנונה / מים /
// חינוך / חוגים). The gate should ask once, and the answer should
// route the row to fixed_commitment (or one_time_expense if the user
// says it's not recurring).

import { runPipeline } from "../supabase/functions/super-service/pipeline.ts";

const ctx = {
  user_name: "לימור",
  household_structure: "family",
  partner_name: "ינון",
  children_names: ["נועה"],
  has_variable_income: "unknown",
  has_partner_or_business_transfers: "unknown",
  planned_files: ["both"],
};

let n = 0;
const r = (source, date, desc, amount, file_id = "f1") => ({
  source, file_id, sheet: "S", row_index: ++n,
  date, raw_description: desc, cleaned_name: desc,
  amount, currency: "ILS", account_mask: "",
});

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) {
  if (cond) { pass++; return; }
  fail++; fails.push(label); console.error("  ✗", label);
}
function eq(a, b, label) { ok(a === b, `${label}  (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`); }

console.log("Ambiguous-vendor gate smoke");
console.log("─".repeat(60));

const ambiguousRows = [
  r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18000),
  r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18000),
  r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18000),
  // Three months of a vendor whose name doesn't disambiguate
  r("bank", "2025-03-05", "החברה לפיתוח גני תקווה", -1700),
  r("bank", "2025-04-05", "החברה לפיתוח גני תקווה", -1700),
  r("bank", "2025-05-05", "החברה לפיתוח גני תקווה", -1700),
  // Some normal rows to round out the file
  r("bank", "2025-03-15", "חברת חשמל", -400),
  r("bank", "2025-04-15", "חברת חשמל", -400),
  r("bank", "2025-05-15", "חברת חשמל", -400),
];

// ── 1. First call surfaces the ambiguous-vendor question ──────────
{
  n = 9; // continue counter (won't matter; runPipeline takes rows as-is)
  const result = await runPipeline({ rows: ambiguousRows, context: ctx });
  ok(result.kind === "needs_clarification", "first call returns needs_clarification");
  if (result.kind === "needs_clarification") {
    const q = result.questions.find(q => q.id === "q-ambiguous-vendor");
    ok(q != null, "ambiguous-vendor question present");
    ok(/החברה לפיתוח/.test(q?.title || ""), "question title mentions the vendor");
    ok(
      q?.options?.some(o => o.value === "municipal") &&
      q?.options?.some(o => o.value === "education") &&
      q?.options?.some(o => o.value === "other_fixed") &&
      q?.options?.some(o => o.value === "one_time"),
      "all 4 answer options present",
    );
    ok(q?.allow_dontknow === true, "allow_dontknow = true");
    eq(q?.reason, "ambiguous_municipal_vendor", "reason = ambiguous_municipal_vendor");
  }
}

// ── 2. Answering 'education' routes rows to fixed_commitment ──────
{
  const answers = [{ question_id: "q-ambiguous-vendor", choice: "education" }];
  const result = await runPipeline({ rows: ambiguousRows, context: ctx, answers });
  ok(result.kind === "report", "second call returns report");
  if (result.kind === "report") {
    const m = result.report_model;
    const fixedHit = m.expense_model.fixed_commitments.find(c => /החברה לפיתוח/.test(c.label));
    ok(fixedHit != null, "ambiguous vendor lands in fixed_commitments after 'education'");
    eq(fixedHit?.monthly_amount, 1700, "monthly = 1700");
  }
}

// ── 3. Answering 'one_time' routes rows to one_time_expenses ──────
{
  const answers = [{ question_id: "q-ambiguous-vendor", choice: "one_time" }];
  const result = await runPipeline({ rows: ambiguousRows, context: ctx, answers });
  ok(result.kind === "report", "third call returns report");
  if (result.kind === "report") {
    const m = result.report_model;
    const inOneTime = m.expense_model.one_time_expenses.filter(c => /החברה לפיתוח/.test(c.label));
    ok(inOneTime.length === 3, `vendor rows move to one_time_expenses (got ${inOneTime.length})`);
    const inFixed = m.expense_model.fixed_commitments.find(c => /החברה לפיתוח/.test(c.label));
    ok(inFixed == null, "vendor NOT in fixed_commitments after 'one_time'");
  }
}

// ── 4. No ambiguous vendor → no q-ambiguous-vendor in questions ───
{
  n = 0;
  const clean = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-03-15", "חברת חשמל", -400),
    r("bank", "2025-04-15", "חברת חשמל", -400),
  ];
  const result = await runPipeline({ rows: clean, context: ctx });
  // Could be report or needs_clarification depending on other rules,
  // but q-ambiguous-vendor should NOT appear.
  if (result.kind === "needs_clarification") {
    ok(
      !result.questions.some(q => q.id === "q-ambiguous-vendor"),
      "clean file does not trigger ambiguous-vendor question",
    );
  } else {
    ok(true, "clean file goes straight to report (no ambiguous-vendor question)");
  }
}

console.log("─".repeat(60));
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) {
  for (const f of fails) console.error("  •", f);
  process.exit(1);
}
