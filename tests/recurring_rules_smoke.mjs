// Test the two new classifier rules:
//   1. rules_housing_rent  — שכירות / שכ"ד caught as fixed_commitment
//   2. rules_recurring_promote — generic recurring vendor with stable
//      amount caught as fixed_commitment instead of falling to review_only
//
// Plus: the report model now surfaces months_present + occurrences on
// every expense item so the renderer can show "appears in N months".

import { extractFacts } from "../supabase/functions/super-service/extract_facts.ts";
import { classify } from "../supabase/functions/super-service/classify/index.ts";
import { buildReportModel } from "../supabase/functions/super-service/build_report_model.ts";

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

console.log("Recurring rules smoke");
console.log("─".repeat(60));

// ── 1. Rent ─────────────────────────────────────────────────────
{
  n = 0;
  const rows = [
    r("bank", "2025-03-01", "שכ\"ד דירה ר\"ג", -9500),
    r("bank", "2025-04-01", "שכ\"ד דירה ר\"ג", -9500),
    r("bank", "2025-05-01", "שכ\"ד דירה ר\"ג", -9500),
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18000),
  ];
  const facts = extractFacts(rows, ctx);
  const cl = classify(facts);
  const m = buildReportModel(facts, cl, [], []);
  const rentRow = m.expense_model.fixed_commitments.find(c => /שכ/.test(c.label));
  ok(rentRow != null, "rent appears in fixed_commitments");
  ok(rentRow?.monthly_amount === 9500, `rent monthly = 9500 (got ${rentRow?.monthly_amount})`);
  ok(rentRow?.months_present === 3, `rent months_present = 3 (got ${rentRow?.months_present})`);
  ok(rentRow?.occurrences === 3, `rent occurrences = 3 (got ${rentRow?.occurrences})`);
}

// ── 2. Generic recurring promotion (a vendor that matches NO keyword) ─
{
  n = 0;
  const rows = [
    r("bank", "2025-03-10", "התאחדות מדרסים ר.ג", -380),
    r("bank", "2025-04-10", "התאחדות מדרסים ר.ג", -380),
    r("bank", "2025-05-10", "התאחדות מדרסים ר.ג", -380),
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18000),
  ];
  const facts = extractFacts(rows, ctx);
  const cl = classify(facts);
  const m = buildReportModel(facts, cl, [], []);
  const inFixed = m.expense_model.fixed_commitments.find(c => /מדרסים/.test(c.label));
  const inReview = m.expense_model.review_only_items.find(c => /מדרסים/.test(c.label));
  ok(inFixed != null, "generic recurring vendor promoted to fixed_commitments");
  ok(inReview == null, "generic recurring vendor NOT in review_only");
  ok(inFixed?.months_present === 3, `promoted vendor months_present = 3 (got ${inFixed?.months_present})`);
}

// ── 3. Single-month tiny vendor stays in review/non-blocking ─────
{
  n = 0;
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18000),
    // single one-off vendor, never seen again — must NOT be promoted
    r("bank", "2025-04-15", "תיקון אינסטלציה", -550),
  ];
  const facts = extractFacts(rows, ctx);
  const cl = classify(facts);
  const m = buildReportModel(facts, cl, [], []);
  const inFixed = m.expense_model.fixed_commitments.find(c => /אינסטלציה/.test(c.label));
  ok(inFixed == null, "single-month vendor NOT promoted to fixed");
}

// ── 4. Variable-amount recurring → flexible_spending (not fixed) ──
{
  n = 0;
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18000),
    // Variable amounts each month (spread ratio ~1.0) — should go to
    // flexible, not fixed.
    r("bank", "2025-03-10", "ספק שירותים כלשהו", -300),
    r("bank", "2025-04-10", "ספק שירותים כלשהו", -700),
    r("bank", "2025-05-10", "ספק שירותים כלשהו", -1100),
  ];
  const facts = extractFacts(rows, ctx);
  const cl = classify(facts);
  const m = buildReportModel(facts, cl, [], []);
  const inFixed = m.expense_model.fixed_commitments.find(c => /ספק שירותים/.test(c.label));
  const inFlex = m.expense_model.flexible_spending.find(c => /ספק שירותים/.test(c.label));
  ok(inFixed == null, "variable-amount vendor NOT in fixed_commitments");
  ok(inFlex != null, "variable-amount vendor IS in flexible_spending");
  ok(inFlex?.months_present === 3, `flexible vendor months_present = 3 (got ${inFlex?.months_present})`);
}

console.log("─".repeat(60));
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) {
  for (const f of fails) console.error("  •", f);
  process.exit(1);
}
