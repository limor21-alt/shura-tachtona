// Medical / kids+education / beauty — one-time small charges become
// non_blocking_item; recurring ones become flexible_spending or
// fixed_commitment.
//
// These categories share a profile: legitimate, common, and often
// trigger false "you're spending too much" alarms in older systems.
// Our rule: don't block on them, don't moralize. Surface at end of report.

import { containsAny, vendorFrequency, type RuleFn } from "./helpers.ts";
import { BEAUTY_KEYWORDS, KIDS_EDU_KEYWORDS, MEDICAL_KEYWORDS } from "./merchants.ts";

const MEDICAL_NON_BLOCKING_MAX = 2000;
const KIDS_NON_BLOCKING_MAX = 1000;
const BEAUTY_NON_BLOCKING_MAX = 1000;

export const ruleMedicalKidsBeauty: RuleFn = (row, ctx) => {
  if (row.amount >= 0) return null;

  const absAmount = Math.abs(row.amount);
  const freq = vendorFrequency(row, ctx.allRows);

  // MEDICAL
  const medical = containsAny(row, MEDICAL_KEYWORDS);
  if (medical) {
    if (freq.occurrences === 1 && absAmount < MEDICAL_NON_BLOCKING_MAX) {
      return {
        rule_id: `medical:one_time_small:${medical}`,
        decision: "non_blocking_item",
        confidence: "high"
      };
    }
    // Recurring medical (insurance copay, prescriptions) → flexible
    return {
      rule_id: `medical:recurring:${medical}`,
      decision: "flexible_spending",
      confidence: "medium"
    };
  }

  // KIDS / EDU
  const kids = containsAny(row, KIDS_EDU_KEYWORDS);
  if (kids) {
    if (freq.occurrences === 1 && absAmount < KIDS_NON_BLOCKING_MAX) {
      return {
        rule_id: `kids:one_time_small:${kids}`,
        decision: "non_blocking_item",
        confidence: "high"
      };
    }
    // Recurring tuition/daycare/חוג → fixed commitment
    if (freq.months_seen.length >= 2) {
      return {
        rule_id: `kids:recurring:${kids}`,
        decision: "fixed_commitment",
        confidence: "medium"
      };
    }
    return {
      rule_id: `kids:single:${kids}`,
      decision: "non_blocking_item",
      confidence: "medium"
    };
  }

  // BEAUTY / PERSONAL CARE
  const beauty = containsAny(row, BEAUTY_KEYWORDS);
  if (beauty) {
    if (freq.occurrences === 1 && absAmount < BEAUTY_NON_BLOCKING_MAX) {
      return {
        rule_id: `beauty:one_time_small:${beauty}`,
        decision: "non_blocking_item",
        confidence: "high"
      };
    }
    return {
      rule_id: `beauty:flexible:${beauty}`,
      decision: "flexible_spending",
      confidence: "medium"
    };
  }

  return null;
};
