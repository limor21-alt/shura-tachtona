// CC dedup — the single most important rule in the engine.
//
// Bank statements include line items like "מקס חיוב", "ישראכרט חיוב"
// etc. — these are NOT expenses, they are the internal transfer of
// money to pay off the credit card. The actual expenses live as
// individual transactions in the credit card files.
//
// Counting both = double-counting ALL credit card spending. This bug
// has broken many past versions. Run this rule FIRST on any bank row.

import { containsAny, type RuleFn } from "./helpers.ts";
import { CC_INTERNAL_CHARGE_PHRASES } from "./merchants.ts";

export const ruleCcDedup: RuleFn = (row, _ctx) => {
  // Only applies to bank rows — credit card transactions in the cc
  // file are real expenses.
  if (row.source !== "bank") return null;

  const match = containsAny(row, CC_INTERNAL_CHARGE_PHRASES);
  if (!match) return null;

  return {
    rule_id: `cc_dedup:${match}`,
    decision: "cc_charge_in_bank",
    confidence: "high"
  };
};
