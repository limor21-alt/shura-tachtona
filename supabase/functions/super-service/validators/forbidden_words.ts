// Post-validator for any Hebrew copy that reaches the user.
//
// Used in two places:
//   1. After Claude returns ClaudeCopy in Stage F — if any field
//      contains a forbidden word, reject the output and use the
//      deterministic fallback from /assets/copy/he.js fallback strings.
//   2. As a safety net pre-render check in build_report_model — any
//      assembled copy that smells wrong populates
//      report_model.forbidden_word_violations, which MUST be empty
//      before rendering.

// Words that betray the wrong tone (panic, judgment, hyperbole).
const FORBIDDEN_WORDS: string[] = [
  "בזבוזים",
  "דורש טיפול מיידי",
  "חמור",
  "מסוכן",
  "חייבים",
  "מוכרחים",
  "קחו הלוואה",
  "טפשי",
  "לא אחראי",
  // The typo guard — past versions repeatedly produced "כעגע"
  // (intended "כרגע"). Any output containing this is rejected.
  "כעגע"
];

// Phrases — multi-word patterns that mean something specific in context.
const FORBIDDEN_PHRASES: RegExp[] = [
  /פי\s*\d+\s*מהממוצע/,         // "פי X מהממוצע"
  /פוטנציאל\s+חיסכון\s+עד/      // "פוטנציאל חיסכון עד ₪X" without evidence
];

// Context-specific rules

/** "/חודש" is forbidden on one-time items. The check requires the
 *  context (is this a one-time slot?) so it lives in a separate fn. */
const PER_MONTH_PATTERN = /\/\s*חודש|לחודש|בחודש/;

/** "פער" is forbidden — surplus context should use "עודף מחושב",
 *  deficit context should use "חוסר חודשי". */
const GAP_WORD_PATTERN = /\bפער\b/;

export interface ValidationViolation {
  field: string;
  reason: string;
  found: string;
}

/** Check a single copy string. Returns array of violations (empty if OK). */
export function validateCopy(
  text: string,
  field: string,
  opts: { isOneTime?: boolean } = {}
): ValidationViolation[] {
  if (!text) return [];
  const violations: ValidationViolation[] = [];

  for (const word of FORBIDDEN_WORDS) {
    if (text.includes(word)) {
      violations.push({ field, reason: `forbidden word: "${word}"`, found: word });
    }
  }

  for (const re of FORBIDDEN_PHRASES) {
    const m = text.match(re);
    if (m) {
      violations.push({ field, reason: `forbidden phrase: ${re}`, found: m[0] });
    }
  }

  if (GAP_WORD_PATTERN.test(text)) {
    violations.push({ field, reason: 'forbidden gap word "פער"', found: "פער" });
  }

  if (opts.isOneTime && PER_MONTH_PATTERN.test(text)) {
    const m = text.match(PER_MONTH_PATTERN);
    violations.push({
      field,
      reason: '"/חודש" on a one-time item',
      found: m ? m[0] : "/חודש"
    });
  }

  return violations;
}

/** Run the full validator across a ClaudeCopy-like object. */
export function validateClaudeCopy(copy: {
  headline_copy?: string;
  meaning_copy?: string;
  work_done_bullets?: string[];
  priority_check_blurbs?: { id: string; copy_blurb: string }[];
  improvement_blurbs?: { id: string; copy_blurb: string }[];
}): ValidationViolation[] {
  const out: ValidationViolation[] = [];

  if (copy.headline_copy) out.push(...validateCopy(copy.headline_copy, "headline_copy"));
  if (copy.meaning_copy)  out.push(...validateCopy(copy.meaning_copy,  "meaning_copy"));

  (copy.work_done_bullets ?? []).forEach((b, i) =>
    out.push(...validateCopy(b, `work_done_bullets[${i}]`))
  );

  (copy.priority_check_blurbs ?? []).forEach((p) =>
    out.push(...validateCopy(p.copy_blurb, `priority_check_blurbs[${p.id}]`))
  );

  (copy.improvement_blurbs ?? []).forEach((p) =>
    out.push(...validateCopy(p.copy_blurb, `improvement_blurbs[${p.id}]`))
  );

  return out;
}

/** Quick helper for unit tests in Phase 6. */
export const _forTests = { FORBIDDEN_WORDS, FORBIDDEN_PHRASES, PER_MONTH_PATTERN, GAP_WORD_PATTERN };
