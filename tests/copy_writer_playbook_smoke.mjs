// Phase 2b: copy_writer playbook integration.
//
// Verifies:
//   1. validateAgainstPlaybook flags forbiddenClaims and doNotSay phrases
//      from the selected playbook (in addition to GLOBAL_LANGUAGE_RULES).
//   2. The deterministic fallback prefers the selected playbook's
//      ui.bottomLineHeadline and ui.meaningBody over the legacy
//      summary_status-based strings.

import { runPipeline } from "../supabase/functions/super-service/pipeline.ts";
import { buildFallbackCopy, validateAgainstPlaybook } from "../supabase/functions/super-service/copy_writer.ts";
import { PLAYBOOKS } from "../supabase/functions/super-service/playbooks.ts";

let pass = 0, fail = 0;
const fails = [];

function ok(cond, label) {
  if (cond) { pass++; return; }
  fail++;
  fails.push(label);
  console.error("  ✗", label);
}
function eq(a, b, label) {
  ok(a === b, `${label}  (expected ${JSON.stringify(b)}, got ${JSON.stringify(a)})`);
}

const baseCtx = {
  user_name: "לימור",
  household_structure: "family",
  partner_name: "ינון",
  children_names: ["נועה"],
  has_variable_income: "no",
  has_partner_or_business_transfers: "no",
  planned_files: ["both"],
};

let n = 0;
const r = (source, date, desc, amount, file_id = "f1") => ({
  source, file_id, sheet: "S", row_index: ++n,
  date, raw_description: desc, cleaned_name: desc,
  amount, currency: "ILS", account_mask: "",
});

console.log("copy_writer + playbook integration");
console.log("─".repeat(60));

// ── 1. validateAgainstPlaybook: subscriptions_creep forbids
//      "פוטנציאל חיסכון עד כל הסכום" — copy containing it must be rejected.
{
  const pb = PLAYBOOKS.subscriptions_creep;
  const dirty = {
    headline_copy: "מנויים שלא נבדקו — פוטנציאל חיסכון עד כל הסכום",
    meaning_copy: "",
    work_done_bullets: [],
    priority_check_blurbs: [],
    improvement_blurbs: [],
  };
  const violations = validateAgainstPlaybook(dirty, pb);
  ok(violations.length > 0, "subscriptions_creep rejects forbidden 'פוטנציאל חיסכון עד כל הסכום'");
  ok(
    violations.some((v) => v.includes("subscriptions_creep")),
    "violation message names the playbook id",
  );
}

// ── 2. validateAgainstPlaybook: clean copy → no violations.
{
  const pb = PLAYBOOKS.subscriptions_creep;
  const clean = {
    headline_copy: "מצאנו מנויים לבדיקה",
    meaning_copy: "לא כולם מיותרים. הפוטנציאל תלוי במה שבאמת בשימוש.",
    work_done_bullets: ["סיכמנו את המנויים"],
    priority_check_blurbs: [{ id: "x", copy_blurb: "כדאי לעבור עליהם." }],
    improvement_blurbs: [],
  };
  const violations = validateAgainstPlaybook(clean, pb);
  eq(violations.length, 0, "clean subscriptions copy passes playbook check");
}

// ── 3. validateAgainstPlaybook: debt_pressure forbids "קחו הלוואה חדשה".
{
  const pb = PLAYBOOKS.debt_pressure;
  const dirty = {
    headline_copy: "יש התחייבות חוב. קחו הלוואה חדשה כדי לסגור.",
    meaning_copy: "",
    work_done_bullets: [],
    priority_check_blurbs: [],
    improvement_blurbs: [],
  };
  const violations = validateAgainstPlaybook(dirty, pb);
  ok(violations.length > 0, "debt_pressure rejects 'קחו הלוואה חדשה'");
}

// ── 4. validateAgainstPlaybook: doNotSay phrases also flagged.
{
  // food_delivery_restaurants_high doNotSay includes "בזבוזים".
  const pb = PLAYBOOKS.food_delivery_restaurants_high;
  const dirty = {
    headline_copy: "Wolt ומסעדות — בזבוזים גדולים",
    meaning_copy: "",
    work_done_bullets: [],
    priority_check_blurbs: [],
    improvement_blurbs: [],
  };
  const violations = validateAgainstPlaybook(dirty, pb);
  ok(violations.length > 0, "food_delivery flags doNotSay phrase 'בזבוזים'");
}

// ── 5. validateAgainstPlaybook: with no playbook → no violations (safe default).
{
  const dirty = {
    headline_copy: "anything goes",
    meaning_copy: "",
    work_done_bullets: [],
    priority_check_blurbs: [],
    improvement_blurbs: [],
  };
  const violations = validateAgainstPlaybook(dirty, null);
  eq(violations.length, 0, "no playbook → no playbook-level violations");
}

// ── 6. Fallback prefers playbook's bottomLineHeadline / meaningBody.
//      Run the partial_credit_only pipeline (no API key set), then check
//      that the fallback copy matches the playbook's ui fields.
{
  n = 0;
  const rows = [
    r("credit_card", "2025-03-22", "Wolt", -120, "f2"),
    r("credit_card", "2025-04-11", "Wolt", -150, "f2"),
    r("credit_card", "2025-03-15", "סופר", -1500, "f2"),
  ];
  const ctx = { ...baseCtx, planned_files: ["cc_only"] };
  const result = await runPipeline({ rows, context: ctx });
  if (result.kind !== "report") throw new Error("expected report, got " + result.kind);
  const model = result.report_model;
  eq(model.selected_playbooks?.primary, "partial_credit_only", "pipeline picks partial_credit_only");

  const fallback = buildFallbackCopy(model);
  const pb = PLAYBOOKS.partial_credit_only;
  eq(fallback.headline_copy, pb.ui.bottomLineHeadline, "fallback headline = playbook bottomLineHeadline");
  eq(fallback.meaning_copy, pb.ui.meaningBody, "fallback meaning = playbook meaningBody");
}

// ── 7. Fallback for partial_bank_only also wired to playbook copy.
{
  n = 0;
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18000),
    r("bank", "2025-03-15", "חברת חשמל", -400),
  ];
  const ctx = { ...baseCtx, planned_files: ["bank_only"] };
  const result = await runPipeline({ rows, context: ctx });
  if (result.kind !== "report") throw new Error("expected report, got " + result.kind);
  const model = result.report_model;
  eq(model.selected_playbooks?.primary, "partial_bank_only", "pipeline picks partial_bank_only");

  const fallback = buildFallbackCopy(model);
  const pb = PLAYBOOKS.partial_bank_only;
  eq(fallback.headline_copy, pb.ui.bottomLineHeadline, "partial_bank fallback headline = playbook");
  eq(fallback.meaning_copy, pb.ui.meaningBody, "partial_bank fallback meaning = playbook");
}

console.log("─".repeat(60));
console.log(`${pass} passed, ${fail} failed`);
if (fail > 0) {
  console.error("\nFailures:");
  for (const f of fails) console.error("  •", f);
  process.exit(1);
}
