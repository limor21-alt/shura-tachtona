// Type contracts for the super-service Edge Function.
//
// This file is the single source of truth for the shape of data that
// flows through the pipeline (Stages A–F). The frontend renderer reads
// `ReportModel` and nothing else.
//
// Hard rules enforced by the type system + downstream validators:
//   - Every number on screen is computed in TS, never invented by Claude.
//   - Claude only writes string fields ending in `_copy`, `_blurb`,
//     `bullets_copy[]`, or `headline_copy`.
//   - One-time income / expense items never carry `/חודש` labels.
//   - `monthly_expenses_total = bank_direct_expenses + cc_file_total`
//     is asserted in build_report_model.ts.

// ====================================================================
// INPUTS — what the browser sends after parsing Excel locally
// ====================================================================

export type FileSource = "bank" | "credit_card";

export interface NormalizedRow {
  source: FileSource;
  file_id: string;
  sheet: string;
  row_index: number;
  /** ISO 8601 date, e.g. "2025-04-22" */
  date: string;
  /** The original bank/credit-card description, untouched.
   *  Salary detection MUST run against this, never against cleaned_name. */
  raw_description: string;
  /** Cleaned/grouped name used for display only. */
  cleaned_name: string;
  /** Signed amount. Negative = outflow, positive = inflow. */
  amount: number;
  currency: "ILS";
  /** Last 4 digits of the account, or short identifier. */
  account_mask: string;
}

export type HouseholdStructure =
  | "single"
  | "couple"
  | "family"
  | "single_parent";

export interface Context {
  user_name: string;
  household_structure: HouseholdStructure;
  partner_name?: string;
  children_names?: string[];
  has_variable_income: "yes" | "no" | "unknown";
  has_partner_or_business_transfers: "yes" | "no" | "unknown";
  planned_files: ("bank" | "credit_card" | "both")[];
}

export interface Answer {
  question_id: string;
  /** Free-form choice value; meaning is question-specific. "unknown" is
   *  the universal opt-out. */
  choice: string;
  note?: string;
}

// ====================================================================
// REQUEST / RESPONSE
// ====================================================================

/** POST / request body. Stateless: client sends everything. */
export interface AnalyzeRequest {
  rows: NormalizedRow[];
  context: Context;
  /** If absent, the gate may return needs_clarification. If present,
   *  the gate is forced to "all answered" mode. */
  answers?: Answer[];
}

export type AnalyzeResponse =
  | { kind: "needs_clarification"; questions: ClarificationQuestion[] }
  | { kind: "report"; report_model: ReportModel };

// ====================================================================
// STAGE A — extract facts (deterministic)
// ====================================================================

export interface Facts {
  rows: NormalizedRow[];
  /** Unique months observed across both files (e.g. ["2025-03","2025-04","2025-05"]) */
  months_covered: string[];
  files_present: { bank: boolean; credit_card: boolean };
  known_merchants_matched: { row_ref: string; merchant_id: string }[];
  parser_warnings: string[];
  context: Context;
}

// ====================================================================
// STAGE B — classification (deterministic)
// ====================================================================

export interface ClassifiedTx {
  row_ref: string;
  rule_id: string;
  decision: ClassificationDecision;
  confidence: "high" | "medium" | "low";
}

export type ClassificationDecision =
  | "fixed_income"
  | "variable_income"
  | "one_time_income_excluded"
  | "internal_transfer_excluded"
  | "uncertain_income"
  | "fixed_commitment"
  | "debt_payment"
  | "flexible_spending"
  | "review_only"
  | "one_time_expense"
  | "non_blocking_item"
  | "cc_charge_in_bank"   // internal transfer; excluded from expenses
  | "household_bill";     // utilities etc.

export interface Classification {
  decisions: ClassifiedTx[];
  cc_dedup_report: {
    bank_charges_excluded: { row_ref: string; amount: number }[];
    cc_file_total: number;
    bank_direct_expenses_total: number;
  };
}

// ====================================================================
// STAGE C — clarification gate (deterministic)
// ====================================================================

export interface ClarificationQuestion {
  id: string;
  /** Short tag shown above the question, e.g. "הכנסה משתנה" */
  meta: string;
  title: string;
  context: string;
  options: { value: string; label: string }[];
  allow_dontknow: boolean;
  /** Why this question is blocking — used for audit_trail only. */
  reason: BlockingReason;
}

export type BlockingReason =
  | "partner_or_business_income"
  | "large_one_time_income"
  | "large_recurring_check"
  | "possible_internal_transfer"
  | "recurring_housing_or_debt"
  | "missing_critical_file";

export interface GateDecision {
  /** 0–5 questions. Ideal 1–3. */
  blocking_questions: ClarificationQuestion[];
  /** Server-internal: question_id → row_refs the question affects.
   *  Used by apply_answers to know which row decisions to override.
   *  Stateless replay: the gate is deterministic, so re-running it on
   *  the same inputs reproduces the same map. */
  question_targets: Record<string, string[]>;
}

// ====================================================================
// STAGE E — final ReportModel (the contract with the frontend)
// ====================================================================

export type ReportType =
  | "full"
  | "partial_credit_only"
  | "partial_bank_only"
  | "low_confidence";

export type Confidence = "high" | "medium" | "low";

export type SummaryStatus =
  | "surplus"
  | "deficit"
  | "balanced"
  | "variable_dependent"
  | "insufficient_data";

export type DisplayMode = "single_scenario" | "two_scenarios";

export interface Scenario {
  name: string;
  income: number;
  expenses: number;
  gap: number;
}

export interface VariableRange {
  min: number;
  max: number;
  months_present: number;
  avg?: number;
}

export interface ReportModel {
  report_type: ReportType;
  data_confidence: Confidence;
  data_confidence_reason: string;

  summary_status: SummaryStatus;
  display_mode: DisplayMode;

  summary: {
    headline_copy: string;          // Claude-written
    meaning_copy: string;           // Claude-written
    monthly_income_fixed: number;
    monthly_income_variable_range: VariableRange | null;
    monthly_expenses_total: number;
    monthly_gap: number;            // positive=surplus, negative=deficit
    gap_label: "עודף מחושב" | "חוסר חודשי" | "מאוזן";
    scenarios?: Scenario[];
  };

  work_done: {
    files_analyzed: { type: FileSource; name: string; months: number; row_count: number }[];
    months_covered: number;
    transactions_reviewed: number;
    cc_charges_deduplicated: number;
    one_time_items_excluded: number;
    bullets_copy: string[];         // Claude-written
  };

  income_model: {
    fixed: { label: string; monthly_amount: number; evidence_count: number; source_examples: string[] }[];
    variable: { label: string; months_present: number; range: { min: number; max: number; avg: number }; evidence: { date: string; amount: number }[] }[];
    one_time_excluded: { label: string; amount: number; date: string; reason: string }[];
    internal_transfers_excluded: { label: string; amount: number; count: number }[];
    uncertain: { label: string; amount: number; why: string }[];
  };

  expense_model: {
    fixed_commitments: { label: string; monthly_amount: number; category: string; evidence: { date: string; amount: number }[] }[];
    debt_payments: { label: string; monthly_amount: number; balance?: number; end_date?: string; evidence: { date: string; amount: number }[] }[];
    flexible_spending: { label: string; monthly_avg: number; category: string; evidence: { date: string; amount: number }[] }[];
    review_only_items: { label: string; monthly_avg?: number; period_total?: number; reason: string; evidence?: { date: string; amount: number }[] }[];
    one_time_expenses: { label: string; amount: number; date: string; category: string }[];
    excluded_internal_transfers: { label: string; amount: number; count: number; target: string }[];
  };

  priority_checks: {
    id: string;
    title: string;
    why_it_matters: string;
    suggested_action: string;
    amount_context: string;
    copy_blurb: string;             // Claude-written
  }[];

  improvement_opportunities: {
    id: string;
    title: string;
    evidence_strength: "confirmed" | "likely" | "review_only";
    amount_label: string;
    copy_blurb: string;             // Claude-written
  }[];

  findings_by_area: {
    area: string;
    monthly_avg: number;
    items: number;
    evidence_strength: "confirmed" | "likely" | "review_only";
  }[];

  non_blocking_items: {
    label: string;
    amount: number;
    date: string;
    suggested_category: string;
    action: "confirm" | "skip";
  }[];

  classification_audit_trail: {
    rules_fired: { rule_id: string; row_ref: string; decision: ClassificationDecision; confidence: "high" | "medium" | "low" }[];
    user_overrides: { question_id: string; before: string; after: string }[];
    excluded_items: { row_ref: string; reason: string }[];
  };

  export_data: {
    json_blob_ref: string | null;
    pdf_url: string | null;
    csv_url: string | null;
  };

  /** Soft warnings from the parser, e.g. "row trim dropped 12 candidates". */
  parser_warnings: string[];
  /** MUST be empty before rendering. The forbidden-words validator
   *  populates this; if non-empty, Claude output is rejected and
   *  deterministic fallback copy is used instead. */
  forbidden_word_violations: string[];
}

// ====================================================================
// STAGE F — Claude copy slots (the only thing Claude writes)
// ====================================================================

/** Exact JSON shape Claude must return. Numbers come from elsewhere;
 *  Claude writes only short Hebrew strings. */
export interface ClaudeCopy {
  headline_copy: string;
  meaning_copy: string;
  work_done_bullets: string[];        // 3–5 short bullets
  priority_check_blurbs: { id: string; copy_blurb: string }[];
  improvement_blurbs: { id: string; copy_blurb: string }[];
}
