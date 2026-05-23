// Stage B — deterministic rule-based classifier (orchestrator).
//
// Rule order matters. CC dedup runs first on bank rows because if a
// row is a credit-card-charge-in-bank, it must be excluded from any
// expense aggregation — and no other rule should be allowed to mis-tag
// it as a merchant or utility based on coincidental keyword overlap.

import type { Classification, ClassifiedTx, Facts, NormalizedRow } from "../schema.ts";
import { buildContext, rowRef, type RuleFn, type RuleResult } from "./helpers.ts";

// Rules
import { ruleCcDedup }            from "./rules_cc_dedup.ts";
import { ruleUtilities }          from "./rules_utilities.ts";
import { ruleDebt }               from "./rules_debt.ts";
import { ruleBitPaybox }          from "./rules_bit_paybox.ts";
import { ruleSubscriptions }      from "./rules_subscriptions.ts";
import { ruleMedicalKidsBeauty }  from "./rules_medical_kids_beauty.ts";
import { ruleFlexibleWolt }       from "./rules_flexible_wolt.ts";
import { ruleKnownMerchants }     from "./rules_known_merchants.ts";

import { ruleSalary }             from "./rules_salary.ts";
import { rulePartnerIncome }      from "./rules_partner_income.ts";
import { ruleSavingsOnetime }     from "./rules_savings_onetime.ts";

/** Order for negative-amount (expense) rows. */
const EXPENSE_RULES: RuleFn[] = [
  ruleCcDedup,              // FIRST — never let CC charges through
  ruleUtilities,
  ruleDebt,
  ruleBitPaybox,
  ruleSubscriptions,
  ruleMedicalKidsBeauty,
  ruleFlexibleWolt,
  ruleKnownMerchants
];

/** Order for positive-amount (income) rows. */
const INCOME_RULES: RuleFn[] = [
  ruleSavingsOnetime,       // FIRST — מגדל / קרן השתלמות disambiguation
  ruleSalary,
  rulePartnerIncome,
  ruleBitPaybox             // BIT/PayBox can also be incoming
];

export function classify(facts: Facts): Classification {
  const ctx = buildContext(facts.rows, facts.context);
  const decisions: ClassifiedTx[] = [];

  const ccBankCharges: { row_ref: string; amount: number }[] = [];

  for (const row of facts.rows) {
    const isIncome = row.amount > 0;
    const rules = isIncome ? INCOME_RULES : EXPENSE_RULES;

    let result: RuleResult | null = null;
    for (const rule of rules) {
      result = rule(row, ctx);
      if (result) break;
    }

    if (!result) {
      result = {
        rule_id: "fallback:uncertain",
        decision: isIncome ? "uncertain_income" : "review_only",
        confidence: "low"
      };
    }

    decisions.push({
      row_ref: rowRef(row),
      rule_id: result.rule_id,
      decision: result.decision,
      confidence: result.confidence
    });

    if (result.decision === "cc_charge_in_bank") {
      ccBankCharges.push({ row_ref: rowRef(row), amount: Math.abs(row.amount) });
    }
  }

  // Aggregate CC dedup totals
  const ccFileTotal = facts.rows
    .filter(r => r.source === "credit_card" && r.amount < 0)
    .reduce((s, r) => s + Math.abs(r.amount), 0);

  const bankDirectExpensesTotal = facts.rows.reduce((sum, row, i) => {
    if (row.source !== "bank") return sum;
    if (row.amount >= 0) return sum;
    if (decisions[i].decision === "cc_charge_in_bank") return sum;
    return sum + Math.abs(row.amount);
  }, 0);

  return {
    decisions,
    cc_dedup_report: {
      bank_charges_excluded: ccBankCharges,
      cc_file_total: ccFileTotal,
      bank_direct_expenses_total: bankDirectExpensesTotal
    }
  };
}

/** Helper for downstream stages: index decisions by row_ref. */
export function indexDecisions(classification: Classification): Map<string, ClassifiedTx> {
  const m = new Map<string, ClassifiedTx>();
  for (const d of classification.decisions) m.set(d.row_ref, d);
  return m;
}

/** Helper: get the decision for a given row. */
export function decisionForRow(
  row: NormalizedRow,
  classification: Classification
): ClassifiedTx | undefined {
  return classification.decisions.find(d => d.row_ref === rowRef(row));
}
