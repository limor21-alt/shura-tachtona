// Debt / loan repayments — fixed_commitment + audit as debt.
//
// Includes mortgage (משכנתא), generic loans (הלוואה), and explicit
// repayment language (החזר, ריבית).

import { containsAny, type RuleFn } from "./helpers.ts";
import { DEBT_KEYWORDS } from "./merchants.ts";

export const ruleDebt: RuleFn = (row, _ctx) => {
  if (row.amount >= 0) return null;

  const match = containsAny(row, DEBT_KEYWORDS);
  if (!match) return null;

  return {
    rule_id: `debt:${match}`,
    decision: "debt_payment",
    confidence: "high"
  };
};
