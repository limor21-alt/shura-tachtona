// Phase 4 smoke test — clarification gate + apply_answers.
//
// Builds scenarios that should + should not trigger blocking questions,
// then verifies the gate returns the right ones with reasonable copy
// AND that apply_answers correctly rewrites decisions per user choice.

import { classify } from "../supabase/functions/super-service/classify/index.ts";
import { extractFacts } from "../supabase/functions/super-service/extract_facts.ts";
import { clarificationGate } from "../supabase/functions/super-service/gate.ts";
import { applyAnswers } from "../supabase/functions/super-service/apply_answers.ts";

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
function assertEq(name, got, expected) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else    { fail++; console.log(`  FAIL  ${name}\n        got:      ${JSON.stringify(got)}\n        expected: ${JSON.stringify(expected)}`); }
}
function assert(name, cond, detail = "") {
  if (cond) { pass++; console.log(`  PASS  ${name}`); }
  else      { fail++; console.log(`  FAIL  ${name}${detail ? "\n        " + detail : ""}`); }
}

// =============================================================
// Scenario A: partner variable income → Q1 fires
// =============================================================
{
  console.log("\nScenario A — partner variable income");
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-05-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-03-12", "העברה מינון שומרוני משכורת", 11500),
    r("bank", "2025-05-04", "העברה מינון שומרוני משכורת", 17500)
  ];
  const facts = extractFacts(rows, ctx);
  const cls = classify(facts);
  const gate = clarificationGate(facts, cls);

  assertEq("gate has exactly 1 question", gate.blocking_questions.length, 1);
  assertEq("question id is q-partner-income", gate.blocking_questions[0]?.id, "q-partner-income");
  assertEq("reason is partner_or_business_income", gate.blocking_questions[0]?.reason, "partner_or_business_income");
  assert("title mentions partner name", gate.blocking_questions[0]?.title?.includes("ינון"));
  assert("context shows the amount range", gate.blocking_questions[0]?.context?.includes("11,500") && gate.blocking_questions[0]?.context?.includes("17,500"));
  assertEq("targets affect 2 partner rows", gate.question_targets["q-partner-income"]?.length, 2);

  // Apply answer "fixed" → both partner rows become fixed_income
  const after = applyAnswers(facts, cls, [{ question_id: "q-partner-income", choice: "fixed" }]);
  const partnerDecisions = after.classification.decisions.filter(d =>
    gate.question_targets["q-partner-income"].includes(d.row_ref)
  );
  assert("all partner rows now fixed_income", partnerDecisions.every(d => d.decision === "fixed_income"));
  assert("overrides recorded", after.overrides.length === 2);

  // Apply answer "internal" → become internal_transfer_excluded
  const afterInternal = applyAnswers(facts, cls, [{ question_id: "q-partner-income", choice: "internal" }]);
  const partnerDecsInternal = afterInternal.classification.decisions.filter(d =>
    gate.question_targets["q-partner-income"].includes(d.row_ref)
  );
  assert("'internal' answer → internal_transfer_excluded", partnerDecsInternal.every(d => d.decision === "internal_transfer_excluded"));

  // Apply answer "unknown" → no override
  const afterUnknown = applyAnswers(facts, cls, [{ question_id: "q-partner-income", choice: "unknown" }]);
  assert("'unknown' answer → no overrides", afterUnknown.overrides.length === 0);
}

// =============================================================
// Scenario B: large one-time income → Q2 fires
// =============================================================
{
  console.log("\nScenario B — large one-time income (Migdal)");
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-22", "מגדל קרן השתלמות פדיון", 31768)
  ];
  const facts = extractFacts(rows, ctx);
  const cls = classify(facts);
  const gate = clarificationGate(facts, cls);

  const q = gate.blocking_questions.find(q => q.id === "q-large-onetime-income");
  assert("Q2 large_one_time_income fires", !!q);
  assert("Q2 title mentions ₪31,768", q?.title?.includes("31,768"));
  assertEq("Q2 reason", q?.reason, "large_one_time_income");

  // Apply "recurring" → migdal row becomes variable_income
  const after = applyAnswers(facts, cls, [{ question_id: "q-large-onetime-income", choice: "recurring" }]);
  const migdalDecision = after.classification.decisions.find(d =>
    gate.question_targets["q-large-onetime-income"].includes(d.row_ref)
  );
  assertEq("'recurring' → variable_income", migdalDecision?.decision, "variable_income");
}

// =============================================================
// Scenario C: small one-time income → Q2 SHOULD NOT fire
// =============================================================
{
  console.log("\nScenario C — small one-time below threshold");
  const rows = [
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-22", "פדיון קטן", 1500)   // tiny payout
  ];
  const facts = extractFacts(rows, ctx);
  const cls = classify(facts);
  const gate = clarificationGate(facts, cls);
  const q = gate.blocking_questions.find(q => q.id === "q-large-onetime-income");
  assert("small one-time does NOT trigger Q2", !q);
}

// =============================================================
// Scenario D: utility recurring → NEVER asks
// =============================================================
{
  console.log("\nScenario D — utilities are never blocking");
  const rows = [
    r("bank", "2025-03-15", "חברת חשמל", -410),
    r("bank", "2025-04-15", "חברת חשמל", -410),
    r("bank", "2025-05-15", "חברת חשמל", -410),
    r("bank", "2025-03-25", "בזק חיוב חודשי", -320),
    r("bank", "2025-04-25", "בזק חיוב חודשי", -320),
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420),
    r("bank", "2025-04-28", "העברה מאמדוקס משכורת", 18420)
  ];
  const ctxNoPartner = { ...ctx, partner_name: undefined };
  const facts = extractFacts(rows, ctxNoPartner);
  const cls = classify(facts);
  const gate = clarificationGate(facts, cls);
  assertEq("no blocking questions for utilities-only flow", gate.blocking_questions.length, 0);
}

// =============================================================
// Scenario E: known non-blocking items (MaccabiDent / PlaySmart / Wolt) — never block
// =============================================================
{
  console.log("\nScenario E — non-blocking small items");
  const rows = [
    r("credit_card", "2025-03-18", "מכבידנט", -942, "cc1"),
    r("credit_card", "2025-04-02", "PlaySmart", -509, "cc1"),
    r("credit_card", "2025-04-15", "Segav Skin", -500, "cc1"),
    r("credit_card", "2025-03-22", "Wolt", -85, "cc1"),
    r("bank", "2025-03-28", "העברה מאמדוקס משכורת", 18420)
  ];
  const ctxNoPartner = { ...ctx, partner_name: undefined };
  const facts = extractFacts(rows, ctxNoPartner);
  const cls = classify(facts);
  const gate = clarificationGate(facts, cls);
  assertEq("zero blocking for small one-times + Wolt", gate.blocking_questions.length, 0);
}

// =============================================================
// Scenario F: possible internal transfer (large bank outflow, "העברה" in desc)
// =============================================================
{
  console.log("\nScenario F — possible internal transfer");
  const rows = [
    r("bank", "2025-03-28", "העברה לחיסכון פק״מ", -8000),
    r("bank", "2025-03-15", "העברה מאמדוקס משכורת", 18420)
  ];
  const ctxNoPartner = { ...ctx, partner_name: undefined };
  const facts = extractFacts(rows, ctxNoPartner);
  const cls = classify(facts);
  const gate = clarificationGate(facts, cls);
  const q = gate.blocking_questions.find(q => q.id === "q-internal-transfer");
  assert("Q3 internal transfer fires", !!q);

  // Apply "internal"
  const after = applyAnswers(facts, cls, [{ question_id: "q-internal-transfer", choice: "internal" }]);
  const xferDecision = after.classification.decisions.find(d =>
    gate.question_targets["q-internal-transfer"].includes(d.row_ref)
  );
  assertEq("internal answer → internal_transfer_excluded", xferDecision?.decision, "internal_transfer_excluded");
}

// =============================================================
// Scenario G: max questions cap
// =============================================================
{
  console.log("\nScenario G — questions cap at MAX (5)");
  // Build a noisy scenario that could in principle trigger every check.
  const rows = [
    r("bank", "2025-03-12", "העברה מינון שומרוני משכורת", 11500),
    r("bank", "2025-05-04", "העברה מינון שומרוני משכורת", 17500),
    r("bank", "2025-04-22", "מגדל קרן השתלמות פדיון", 31768),
    r("bank", "2025-04-22", "פיצויים תשלום", 25000),
    r("bank", "2025-03-15", "העברה לחיסכון", -6000),
    r("bank", "2025-04-15", "העברה לפק״מ", -8500)
  ];
  const facts = extractFacts(rows, ctx);
  const cls = classify(facts);
  const gate = clarificationGate(facts, cls);
  assert("questions ≤ 5", gate.blocking_questions.length <= 5);
  // Currently we have 3 check types so expect ≤ 3
  assert("questions ≤ 3 (current check count)", gate.blocking_questions.length <= 3);
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
