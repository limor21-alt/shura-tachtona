// Stage A — extract facts from normalized rows.
//
// Pure, deterministic, no AI. Phase 2 skeleton; real implementation
// in Phase 3.

import type { Context, Facts, NormalizedRow } from "./schema.ts";

export function extractFacts(rows: NormalizedRow[], context: Context): Facts {
  const months = new Set<string>();
  const filesPresent = { bank: false, credit_card: false };
  const parserWarnings: string[] = [];

  for (const r of rows) {
    if (r.date && typeof r.date === "string" && r.date.length >= 7) {
      months.add(r.date.slice(0, 7));
    }
    if (r.source === "bank") filesPresent.bank = true;
    if (r.source === "credit_card") filesPresent.credit_card = true;
  }

  // Phase 3 will populate known_merchants_matched by scanning
  // raw_description against the dictionaries in classify/merchants.ts.

  return {
    rows,
    months_covered: Array.from(months).sort(),
    files_present: filesPresent,
    known_merchants_matched: [],
    parser_warnings: parserWarnings,
    context
  };
}
