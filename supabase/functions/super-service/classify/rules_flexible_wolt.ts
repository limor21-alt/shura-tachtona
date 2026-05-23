// Food / restaurants / Wolt — flexible_spending.
//
// Areas where the user has direct day-to-day control. We surface these
// as "control opportunities" in the report. NEVER as "waste" or
// "excessive". No moral judgment.

import { containsAny, type RuleFn } from "./helpers.ts";
import { FOOD_KEYWORDS } from "./merchants.ts";

export const ruleFlexibleWolt: RuleFn = (row, _ctx) => {
  if (row.amount >= 0) return null;

  const match = containsAny(row, FOOD_KEYWORDS);
  if (!match) return null;

  return {
    rule_id: `flexible_food:${match}`,
    decision: "flexible_spending",
    confidence: "high"
  };
};
