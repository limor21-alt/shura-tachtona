// Stage E — assemble the final ReportModel from facts + classification + answers.
//
// Pure, deterministic. Every number on the screen is computed here.
// At the end we run all invariants. If any invariant fails we throw
// rather than render — the frontend NEVER sees an inconsistent report.
//
// Phase 2 skeleton.

import type { Answer, Classification, Facts, ReportModel } from "./schema.ts";
import { assertAllInvariants } from "./validators/invariants.ts";

export function buildReportModel(
  _facts: Facts,
  _classification: Classification,
  _answers: Answer[],
  _overrides: { question_id: string; before: string; after: string }[]
): ReportModel {
  // Phase 2 placeholder. Phase 5 builds this for real.
  //
  // The shape returned MUST exactly match the ReportModel interface.
  // The frontend (assets/data/mock_report.js) already demonstrates the
  // expected shape end-to-end.
  const placeholder: ReportModel = {
    report_type: "low_confidence",
    data_confidence: "low",
    data_confidence_reason: "Phase 2 placeholder",
    summary_status: "insufficient_data",
    display_mode: "single_scenario",
    summary: {
      headline_copy: "",
      meaning_copy: "",
      monthly_income_fixed: 0,
      monthly_income_variable_range: null,
      monthly_expenses_total: 0,
      monthly_gap: 0,
      gap_label: "מאוזן"
    },
    work_done: {
      files_analyzed: [],
      months_covered: 0,
      transactions_reviewed: 0,
      cc_charges_deduplicated: 0,
      one_time_items_excluded: 0,
      bullets_copy: []
    },
    income_model: {
      fixed: [],
      variable: [],
      one_time_excluded: [],
      internal_transfers_excluded: [],
      uncertain: []
    },
    expense_model: {
      fixed_commitments: [],
      debt_payments: [],
      flexible_spending: [],
      review_only_items: [],
      one_time_expenses: [],
      excluded_internal_transfers: []
    },
    priority_checks: [],
    improvement_opportunities: [],
    findings_by_area: [],
    non_blocking_items: [],
    classification_audit_trail: {
      rules_fired: [],
      user_overrides: [],
      excluded_items: []
    },
    export_data: {
      json_blob_ref: null,
      pdf_url: null,
      csv_url: null
    },
    parser_warnings: [],
    forbidden_word_violations: []
  };

  // Invariants run last. Phase 2 placeholder is internally consistent
  // (everything is zero), so this will pass — but we keep the call
  // here so the pipeline shape is locked in from day one.
  assertAllInvariants(placeholder);

  return placeholder;
}
