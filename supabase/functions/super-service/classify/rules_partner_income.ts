// Partner / business income — variable.
//
// Heuristic: positive amount + raw_description contains the partner's
// name (from context) OR contains a salary keyword with high variance
// across months. The signal is the variance, not the magnitude.
//
// Past versions also failed when "העברה מינון שומרוני משכורת" was
// pre-cleaned to "ינון שומרוני" — losing the "משכורת" hint.

import { amountVariance, containsAny, type RuleFn } from "./helpers.ts";
import { SALARY_KEYWORDS } from "./merchants.ts";

const HIGH_VARIANCE_THRESHOLD = 0.20; // spread/mean ratio

export const rulePartnerIncome: RuleFn = (row, ctx) => {
  if (row.amount <= 0) return null;

  const partner = ctx.context.partner_name?.trim();
  const norm = (s: string) => s.toLowerCase();

  const hasPartner = !!partner && norm(row.raw_description).includes(norm(partner));
  const hasSalaryKeyword = !!containsAny(row, SALARY_KEYWORDS);

  if (!hasPartner && !hasSalaryKeyword) return null;

  const { spreadRatio, min, max } = amountVariance(row, ctx.allRows);
  const variesAcrossMonths = spreadRatio > HIGH_VARIANCE_THRESHOLD || min === 0 || max === 0;

  // Strong: partner name + salary keyword + variance
  if (hasPartner && hasSalaryKeyword && variesAcrossMonths) {
    return {
      rule_id: "partner_salary:variable",
      decision: "variable_income",
      confidence: "high"
    };
  }

  // Medium: partner name + variance (no explicit keyword)
  if (hasPartner && variesAcrossMonths) {
    return {
      rule_id: "partner_transfer:variable",
      decision: "variable_income",
      confidence: "medium"
    };
  }

  // Medium: salary keyword + high variance (no employer or partner match —
  // could be a freelance retainer that varies)
  if (hasSalaryKeyword && variesAcrossMonths) {
    return {
      rule_id: "salary_variable:no_employer",
      decision: "variable_income",
      confidence: "medium"
    };
  }

  // Partner name without variance — could be regular family transfer.
  // Leave to user clarification via the gate.
  if (hasPartner) {
    return {
      rule_id: "partner_transfer:uncertain",
      decision: "uncertain_income",
      confidence: "low"
    };
  }

  return null;
};
