// Stage D — apply user answers to the classification.
//
// Stateless replay: re-runs the gate to get question_targets, then
// rewrites the affected ClassifiedTx decisions. Records every change
// in overrides for the audit trail.
//
// Mapping logic per question kind:
//   q-partner-income:
//     "fixed"    → row decision becomes fixed_income
//     "variable" → no change (already variable)
//     "internal" → row decision becomes internal_transfer_excluded
//     "unknown"  → no change
//
//   q-large-onetime-income:
//     "one_time"  → no change
//     "recurring" → one_time_income_excluded → variable_income
//     "unknown"   → no change
//
//   q-internal-transfer:
//     "internal" → review_only → internal_transfer_excluded
//     "expense"  → no change (stays review_only)
//     "unknown"  → no change
//
//   q-ambiguous-vendor:
//     "municipal"   → fixed_commitment (force; row may have been
//                     review_only or already fixed)
//     "education"   → fixed_commitment
//     "other_fixed" → fixed_commitment
//     "one_time"    → one_time_expense
//     "unknown"     → no change

import type {
  Answer,
  ClassificationDecision,
  Classification,
  Facts
} from "./schema.ts";
import { clarificationGate } from "./gate.ts";

export interface AppliedAnswers {
  classification: Classification;
  overrides: { question_id: string; before: string; after: string }[];
}

function decisionAfterAnswer(
  questionId: string,
  choice: string,
  before: ClassificationDecision
): ClassificationDecision | null {
  if (choice === "unknown") return null;

  if (questionId === "q-partner-income") {
    if (choice === "fixed")    return "fixed_income";
    if (choice === "variable") return before === "variable_income" ? null : "variable_income";
    if (choice === "internal") return "internal_transfer_excluded";
  }

  if (questionId === "q-large-onetime-income") {
    if (choice === "one_time")  return null;
    if (choice === "recurring") return "variable_income";
  }

  if (questionId === "q-internal-transfer") {
    if (choice === "internal") return "internal_transfer_excluded";
    if (choice === "expense")  return null;
  }

  if (questionId === "q-ambiguous-vendor") {
    if (choice === "municipal" || choice === "education" || choice === "other_fixed") {
      return before === "fixed_commitment" ? null : "fixed_commitment";
    }
    if (choice === "one_time") {
      return before === "one_time_expense" ? null : "one_time_expense";
    }
  }

  return null;
}

export function applyAnswers(
  facts: Facts,
  classification: Classification,
  answers: Answer[]
): AppliedAnswers {
  // Replay the gate to know which row_refs each question affects.
  const gate = clarificationGate(facts, classification);
  const targets = gate.question_targets;

  // Index decisions by row_ref for efficient lookup.
  const byRef = new Map(classification.decisions.map(d => [d.row_ref, d]));
  const overrides: { question_id: string; before: string; after: string }[] = [];

  for (const ans of answers) {
    const affectedRefs = targets[ans.question_id];
    if (!affectedRefs || affectedRefs.length === 0) continue;

    for (const ref of affectedRefs) {
      const d = byRef.get(ref);
      if (!d) continue;
      const after = decisionAfterAnswer(ans.question_id, ans.choice, d.decision);
      if (!after || after === d.decision) continue;

      overrides.push({ question_id: ans.question_id, before: d.decision, after });
      byRef.set(ref, {
        ...d,
        decision: after,
        rule_id: `user_override:${ans.question_id}:${ans.choice}`,
        confidence: "high"
      });
    }
  }

  const newDecisions = classification.decisions.map(d => byRef.get(d.row_ref) ?? d);

  return {
    classification: {
      decisions: newDecisions,
      cc_dedup_report: classification.cc_dedup_report
    },
    overrides
  };
}
