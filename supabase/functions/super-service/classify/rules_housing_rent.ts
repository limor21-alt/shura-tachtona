// Housing — rent (שכירות / שכ"ד) and similar recurring residential
// payments that don't already match a known merchant or a mortgage.
// Mortgages (משכנתא) are handled in rules_debt.ts.

import { containsAny, vendorFrequency, type RuleFn } from "./helpers.ts";

const RENT_KEYWORDS = [
  "שכירות",
  'שכ"ד',
  "שכ״ד",
  "שכר דירה",
  "שכ\"ד",
  "ועד בית",
];

const RENT_MIN = 1500; // anything smaller is unlikely to be actual rent

export const ruleHousingRent: RuleFn = (row, ctx) => {
  if (row.amount >= 0) return null;

  const matched = containsAny(row, RENT_KEYWORDS);
  if (!matched) return null;

  const absAmount = Math.abs(row.amount);
  if (absAmount < RENT_MIN) return null;

  const freq = vendorFrequency(row, ctx.allRows);

  // Recurring rent → confidently fixed.
  if (freq.months_seen.length >= 2) {
    return {
      rule_id: `housing:rent_recurring:${matched}`,
      decision: "fixed_commitment",
      confidence: "high",
    };
  }

  // Single observed rent payment in the available window — still a
  // commitment, just with medium confidence (the window might be short).
  return {
    rule_id: `housing:rent_single:${matched}`,
    decision: "fixed_commitment",
    confidence: "medium",
  };
};
