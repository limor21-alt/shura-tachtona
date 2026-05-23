// Stage C — clarification gate.
//
// Decides which (if any) questions block the report. Allowlist only:
// a candidate row is asked about ONLY if its category matches one of
// the BlockingReason values in schema.ts AND it materially changes
// the final diagnosis.
//
// Never blocking:
//   - utilities, BIT/PayBox, municipal charges
//   - small one-time medical/kids/beauty under threshold
//   - known merchants
//   - small subscriptions
//   - grocery/pharmacy/restaurant charges
//
// Phase 2 skeleton.

import type { Classification, Facts, GateDecision } from "./schema.ts";

export const MAX_BLOCKING_QUESTIONS = 5;
export const IDEAL_BLOCKING_QUESTIONS = 3;

export function clarificationGate(
  _facts: Facts,
  _classification: Classification
): GateDecision {
  // Phase 2: no questions. Phase 4 populates from allowlist rules.
  return { blocking_questions: [] };
}
