// Utilities — חשמל, מים, גז, בזק, etc.
//
// Always classified as household_bill / fixed_commitment.
// NEVER blocking — the user does not need to confirm an electricity bill.

import { containsAny, type RuleFn } from "./helpers.ts";
import { UTILITY_KEYWORDS } from "./merchants.ts";

export const ruleUtilities: RuleFn = (row, _ctx) => {
  if (row.amount >= 0) return null; // utilities are expenses (negative)

  const match = containsAny(row, UTILITY_KEYWORDS);
  if (!match) return null;

  return {
    rule_id: `utility:${match}`,
    decision: "household_bill",
    confidence: "high"
  };
};
