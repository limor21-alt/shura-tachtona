// Known merchants fallback — catches recurring vendor names that don't
// fall into the more specific category rules. Decision depends on
// whether the charge is recurring (fixed_commitment) or one-off
// (one_time_expense).
//
// Phase 3 keeps this minimal. The dictionary is intentionally not in
// merchants.ts yet — this rule is a safety net, not an exhaustive
// merchant database. Real merchant enrichment comes later.

import { isRecurringMonthly, vendorFrequency, type RuleFn } from "./helpers.ts";

const RECURRING_THRESHOLD_MONTHS = 2;

export const ruleKnownMerchants: RuleFn = (row, ctx) => {
  if (row.amount >= 0) return null;

  const freq = vendorFrequency(row, ctx.allRows);

  // Recurring exact match → fixed commitment (insurance, gym, etc.)
  if (freq.months_seen.length >= RECURRING_THRESHOLD_MONTHS && Math.abs(row.amount) >= 100) {
    return {
      rule_id: "merchant:recurring",
      decision: "fixed_commitment",
      confidence: "medium"
    };
  }

  return null;
};
