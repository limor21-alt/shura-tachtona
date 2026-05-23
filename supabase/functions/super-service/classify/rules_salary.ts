// Salary detection — fixed income.
//
// MUST scan raw_description, NEVER cleaned_name. Past versions broke
// when "העברה מינון שומרוני משכורת" was cleaned to "ינון שומרוני" —
// the word "משכורת" disappeared and salary detection failed.
//
// Two paths to fixed_income:
//   1. Employer match + (salary keyword OR positive recurring amount)
//   2. Generic salary keyword + recurring monthly amount with low variance

import { amountVariance, containsAny, isRecurringMonthly, type RuleFn } from "./helpers.ts";
import { KNOWN_EMPLOYERS, SALARY_KEYWORDS } from "./merchants.ts";

const LOW_VARIANCE_THRESHOLD = 0.15; // spread/mean ratio

export const ruleSalary: RuleFn = (row, ctx) => {
  if (row.amount <= 0) return null; // salary is positive

  const employer = containsAny(row, KNOWN_EMPLOYERS);
  const keyword = containsAny(row, SALARY_KEYWORDS);

  // Path 1: employer match. High confidence even if keyword absent —
  // direct deposits from known employers are payroll.
  if (employer) {
    return {
      rule_id: `salary:employer_match:${employer}`,
      decision: "fixed_income",
      confidence: "high"
    };
  }

  // Path 2: salary keyword + recurring + low variance.
  // Without an employer name we need stronger statistical evidence.
  if (keyword) {
    const recurring = isRecurringMonthly(row, ctx.allRows);
    if (!recurring) {
      // Single salary-keyword hit — uncertain. Let a later rule
      // (partner_income or savings_onetime) catch it; otherwise fall
      // through to uncertain_income.
      return null;
    }
    const { spreadRatio } = amountVariance(row, ctx.allRows);
    if (spreadRatio <= LOW_VARIANCE_THRESHOLD) {
      return {
        rule_id: `salary:keyword_recurring:${keyword}`,
        decision: "fixed_income",
        confidence: "medium"
      };
    }
    // High variance recurring → likely variable. Let rules_partner_income handle.
    return null;
  }

  return null;
};
