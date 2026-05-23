// Savings / one-time income — מגדל, קרן השתלמות, גמל, פיצויים, פדיון.
//
// ALWAYS excluded from monthly_income_fixed. Never displayed with /חודש.
// Display rule: "₪X · חד־פעמי · לא נספר כהכנסה חודשית"

import { containsAny, vendorFrequency, type RuleFn } from "./helpers.ts";
import { ONE_TIME_INCOME_KEYWORDS } from "./merchants.ts";

const RECURRING_PENSION_THRESHOLD = 3; // ≥3 months → likely recurring pension

export const ruleSavingsOnetime: RuleFn = (row, ctx) => {
  if (row.amount <= 0) return null;

  const match = containsAny(row, ONE_TIME_INCOME_KEYWORDS);
  if (!match) return null;

  // Disambiguation: a small recurring pension payment may also match
  // these keywords. If we see ≥3 distinct months with small-to-medium
  // amounts, treat as variable income (not one-time excluded).
  const freq = vendorFrequency(row, ctx.allRows);
  if (freq.months_seen.length >= RECURRING_PENSION_THRESHOLD) {
    return {
      rule_id: `pension_recurring:${match}`,
      decision: "variable_income",
      confidence: "medium"
    };
  }

  return {
    rule_id: `one_time_income:${match}`,
    decision: "one_time_income_excluded",
    confidence: "high"
  };
};
