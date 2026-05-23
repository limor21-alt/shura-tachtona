// Stage F — Claude copy writer.
//
// Takes a fully-computed ReportModel and calls Claude with the system
// prompt from prompt.ts. Claude returns a ClaudeCopy object with short
// Hebrew strings for named slots. We validate the output against
// forbidden_words.ts. On rejection we use the deterministic fallback
// strings (already in frontend at assets/copy/he.js).
//
// Phase 2 skeleton — does not call Claude yet. Returns empty strings
// so the renderer falls through to fallback copy.

import type { ClaudeCopy, ReportModel } from "./schema.ts";
import { validateClaudeCopy } from "./validators/forbidden_words.ts";

export async function writeCopy(_model: ReportModel): Promise<ClaudeCopy> {
  // Phase 5 will:
  //   1. Build user message via buildUserMessage(reportModel) from prompt.ts
  //   2. POST to Anthropic API with SYSTEM_PROMPT
  //   3. Parse the response JSON
  //   4. Run validateClaudeCopy(parsed) — if violations, fall back
  //   5. Return the validated copy
  //
  // Phase 2: empty strings, renderer uses fallback.
  const empty: ClaudeCopy = {
    headline_copy: "",
    meaning_copy: "",
    work_done_bullets: [],
    priority_check_blurbs: [],
    improvement_blurbs: []
  };

  const violations = validateClaudeCopy(empty);
  if (violations.length > 0) {
    // Defensive: empty strings never violate; this branch should be unreachable.
    return empty;
  }

  return empty;
}
