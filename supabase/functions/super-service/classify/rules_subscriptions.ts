// Subscriptions — review_only by default.
//
// Past versions presented "potential savings up to ₪X" for subscriptions
// without any evidence of duplication or non-use. That's a fabrication.
// We surface subscriptions as a review category and let the user decide.
//
// The only time a subscription becomes a confirmed savings finding is
// when we have explicit evidence (duplicate services, identical amounts
// from two different vendors, etc.). That logic lives in
// build_report_model.ts, not here.

import { containsAny, type RuleFn } from "./helpers.ts";
import { SUBSCRIPTION_KEYWORDS } from "./merchants.ts";

export const ruleSubscriptions: RuleFn = (row, _ctx) => {
  if (row.amount >= 0) return null;

  const match = containsAny(row, SUBSCRIPTION_KEYWORDS);
  if (!match) return null;

  return {
    rule_id: `subscription:${match}`,
    decision: "review_only",
    confidence: "high"
  };
};
