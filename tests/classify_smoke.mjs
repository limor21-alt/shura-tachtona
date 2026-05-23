// Phase 3 smoke test — runs the classifier against synthetic
// NormalizedRow data that covers core acceptance scenarios.
//
// Maps decisions back via row_ref (not array index) because
// extractFacts() reorders rows for salary-priority trimming.

import { classify } from "../supabase/functions/super-service/classify/index.ts";
import { extractFacts } from "../supabase/functions/super-service/extract_facts.ts";

const ctx = {
  user_name: "לימור",
  household_structure: "family",
  partner_name: "ינון",
  children_names: ["נועה", "איתי"],
  has_variable_income: "yes",
  has_partner_or_business_transfers: "yes",
  planned_files: ["both"]
};

let rowCounter = 0;
const r = (source, date, desc, amount, file_id = "f1") => {
  const row = {
    source,
    file_id,
    sheet: "Sheet1",
    row_index: ++rowCounter,
    date,
    raw_description: desc,
    cleaned_name: desc,
    amount,
    currency: "ILS",
    account_mask: ""
  };
  row._ref = `${source}:${file_id}:${row.row_index}`;
  return row;
};

const rows = [
  // #1 Amdocs salary across 3 months — fixed_income
  r("bank", "2025-03-28", "העברה מאמדוקס משכורת",  18420),
  r("bank", "2025-04-28", "העברה מאמדוקס משכורת",  18420),
  r("bank", "2025-05-28", "העברה מאמדוקס משכורת",  18420),

  // #2 Partner (ינון) variable transfers — variable_income
  r("bank", "2025-03-12", "העברה מינון שומרוני משכורת", 11500),
  r("bank", "2025-05-04", "העברה מינון שומרוני משכורת", 17500),

  // #3 Migdal one-time
  r("bank", "2025-04-22", "מגדל קרן השתלמות פדיון", 31768),

  // #4 Electricity recurring
  r("bank", "2025-03-15", "חברת חשמל",  -410),
  r("bank", "2025-04-15", "חברת חשמל",  -410),
  r("bank", "2025-05-15", "חברת חשמל",  -410),

  // #5 MaccabiDent one-time small
  r("credit_card", "2025-03-18", "מכבידנט סניף", -942, "f2"),

  // #6 PlaySmart one-time
  r("credit_card", "2025-04-02", "PlaySmart",    -509, "f2"),

  // #7 Segav Skin one-time
  r("credit_card", "2025-04-15", "Segav Skin",   -500, "f2"),

  // #8 Wolt / restaurants
  r("credit_card", "2025-03-22", "Wolt",         -85, "f2"),
  r("credit_card", "2025-04-11", "Wolt",         -120, "f2"),
  r("credit_card", "2025-05-08", "מסעדה אגדה",   -350, "f2"),

  // #9 Subscriptions
  r("credit_card", "2025-03-10", "Netflix",      -54, "f2"),
  r("credit_card", "2025-04-10", "Netflix",      -54, "f2"),
  r("credit_card", "2025-04-12", "Spotify",      -22, "f2"),

  // #10 BIT
  r("bank", "2025-03-20", "BIT העברה",     -300),
  r("bank", "2025-04-20", "BIT העברה",     -440),

  // #14 CC dedup — "מקס חיוב" in bank
  r("bank", "2025-03-30", "מקס חיוב",     -4200),
  r("bank", "2025-04-30", "מקס חיוב",     -4200),
  r("bank", "2025-05-30", "מקס חיוב",     -4200),

  // CC file rows (the real expenses)
  r("credit_card", "2025-03-22", "סופר ויקטורי", -1500, "f2"),
  r("credit_card", "2025-04-22", "סופר ויקטורי", -1500, "f2"),

  // Debt
  r("bank", "2025-03-05", "הלוואה הפועלים החזר", -1750),
  r("bank", "2025-04-05", "הלוואה הפועלים החזר", -1750),
  r("bank", "2025-05-05", "הלוואה הפועלים החזר", -1750),

  // Utility — Bezeq
  r("bank", "2025-03-25", "בזק חיוב חודשי", -320),
  r("bank", "2025-04-25", "בזק חיוב חודשי", -320),
  r("bank", "2025-05-25", "בזק חיוב חודשי", -320)
];

// Remove the _ref helper before passing to extractFacts (not in schema)
const cleanRows = rows.map(({ _ref, ...rest }) => rest);
const facts = extractFacts(cleanRows, ctx);
const cls = classify(facts);

// Map decisions by row_ref
const byRef = new Map();
for (const d of cls.decisions) byRef.set(d.row_ref, d);

let pass = 0, fail = 0;
function check(name, row, expected) {
  const d = byRef.get(row._ref);
  const got = d ? d.decision : "MISSING";
  const ok = got === expected;
  if (ok) { pass++; console.log(`  PASS  ${name.padEnd(42)} → ${got}`); }
  else    { fail++; console.log(`  FAIL  ${name.padEnd(42)} → got ${got}, expected ${expected}`); }
}

console.log("Phase 3 classifier smoke test\n");
check("#1 Amdocs salary (Mar)",        rows[0],  "fixed_income");
check("#1 Amdocs salary (Apr)",        rows[1],  "fixed_income");
check("#2 Partner variable (low)",     rows[3],  "variable_income");
check("#2 Partner variable (high)",    rows[4],  "variable_income");
check("#3 Migdal one-time",            rows[5],  "one_time_income_excluded");
check("#4 Electricity recurring",      rows[6],  "household_bill");
check("#5 MaccabiDent one-time small", rows[9],  "non_blocking_item");
check("#6 PlaySmart one-time",         rows[10], "non_blocking_item");
check("#7 Segav Skin one-time",        rows[11], "non_blocking_item");
check("#8 Wolt flexible",              rows[12], "flexible_spending");
check("#9 Netflix review_only",        rows[15], "review_only");
check("#10 BIT review_only (out)",     rows[18], "review_only");
check("#14 CC charge in bank (max)",   rows[20], "cc_charge_in_bank");
check("CC file row — סופר",            rows[23], "flexible_spending");
check("Debt — loan repayment",         rows[25], "debt_payment");
check("Utility — Bezeq",               rows[28], "household_bill");

console.log(`\n${pass} passed, ${fail} failed`);

console.log("\nCC dedup report:");
console.log("  bank charges excluded:", cls.cc_dedup_report.bank_charges_excluded.length, "rows");
console.log("  cc_file_total:        ₪", cls.cc_dedup_report.cc_file_total.toLocaleString());
console.log("  bank_direct_expenses: ₪", cls.cc_dedup_report.bank_direct_expenses_total.toLocaleString());

// Invariant: bank_direct + cc_file = total expense, NEVER includes bank CC charges
const ccBankExcluded = cls.cc_dedup_report.bank_charges_excluded.reduce((s, x) => s + x.amount, 0);
console.log(`\nCritical invariant: bank CC charges (${ccBankExcluded.toLocaleString()}) NOT counted as expense.`);
console.log("Expected: 12,600 (3x4200) excluded. Actual:", ccBankExcluded);

if (fail > 0) process.exit(1);
