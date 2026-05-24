// Recurring-vendor promotion — last resort BEFORE the implicit
// `review_only` fallback.
//
// Problem this solves: many real recurring obligations (rent paid via
// transfer, ongoing class fees, small services) don't match any keyword
// in our merchant lists. Without this rule they fall through to
// review_only, which makes the report feel like the system is dumping
// uncertainty on the user. The product premise is "we figure it out"
// — so if the data clearly shows a vendor appearing in ≥2 months with
// stable amounts, we should classify it as a fixed_commitment.
//
// Guardrails:
//   - amount floor (≥₪200) — tiny recurring charges stay flexible.
//   - low variance (spreadRatio ≤ 0.5) — variable amounts go to
//     flexible_spending instead.
//   - never recurring-promote credit-card-in-bank charges (those are
//     handled by rules_cc_dedup before this rule runs).

import { amountVariance, type RuleFn, vendorFrequency } from "./helpers.ts";

const RECURRING_MIN_AMOUNT = 100;
const RECURRING_MIN_MONTHS = 2;
const STABLE_SPREAD_RATIO = 0.5;
const FLEXIBLE_SPREAD_RATIO_MAX = 1.2;

export const ruleRecurringPromote: RuleFn = (row, ctx) => {
  if (row.amount >= 0) return null;

  const absAmount = Math.abs(row.amount);
  if (absAmount < RECURRING_MIN_AMOUNT) return null;

  const freq = vendorFrequency(row, ctx.allRows);
  if (freq.months_seen.length < RECURRING_MIN_MONTHS) return null;

  const { spreadRatio } = amountVariance(row, ctx.allRows);

  // Stable amount → fixed commitment (rent, gym membership, ongoing class).
  if (spreadRatio <= STABLE_SPREAD_RATIO) {
    return {
      rule_id: `recurring_promote:stable:${freq.months_seen.length}m`,
      decision: "fixed_commitment",
      confidence: spreadRatio < 0.2 ? "high" : "medium",
    };
  }

  // Variable amount but still clearly recurring → flexible_spending
  // (so it shows up in "where you have control" rather than vanishing
  // into review_only).
  if (spreadRatio <= FLEXIBLE_SPREAD_RATIO_MAX) {
    return {
      rule_id: `recurring_promote:flexible:${freq.months_seen.length}m`,
      decision: "flexible_spending",
      confidence: "medium",
    };
  }

  // Very high variance — leave for the implicit review_only fallback;
  // gate may surface it as a question instead of guessing.
  return null;
};
