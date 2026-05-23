// BIT / PayBox transfers — review_only blind spots.
//
// We don't know who the recipient is. Never treated as a confirmed
// expense or savings opportunity. Surfaced in priority_checks as a
// "blind spot" item the user can choose to break down.

import { containsAny, type RuleFn } from "./helpers.ts";
import { BIT_PAYBOX_KEYWORDS } from "./merchants.ts";

export const ruleBitPaybox: RuleFn = (row, _ctx) => {
  // BIT/PayBox can be positive (incoming) or negative (outgoing). Both
  // get flagged for review.
  const match = containsAny(row, BIT_PAYBOX_KEYWORDS);
  if (!match) return null;

  return {
    rule_id: `bit_paybox:${match}`,
    decision: "review_only",
    confidence: "medium"
  };
};
