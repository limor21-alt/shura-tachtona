// Stage D — apply user answers to the classification.
//
// Takes the existing classification and the user's answers, and produces
// an updated classification with overrides applied. Each override is
// also recorded in the audit trail so the final report can show what
// changed.
//
// Phase 2 skeleton.

import type { Answer, Classification } from "./schema.ts";

export interface AppliedAnswers {
  classification: Classification;
  overrides: { question_id: string; before: string; after: string }[];
}

export function applyAnswers(
  classification: Classification,
  answers: Answer[]
): AppliedAnswers {
  // Phase 2: no-op. Phase 4 implementation will re-run affected rules
  // with user-provided overrides.
  return {
    classification,
    overrides: []
  };
}
