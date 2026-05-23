// Stage A — extract facts from normalized rows.
//
// Pure, deterministic. No AI.
//
// Critical: row trimming keeps ≥300 rows per (source, sheet) pair,
// prioritizing rows that contain salary keywords. Past versions
// trimmed to 50 and hid the salary entry from later months — making
// a fixed salary look "one-time" and breaking the whole report.

import type { Context, Facts, NormalizedRow } from "./schema.ts";
import { SALARY_KEYWORDS } from "./classify/merchants.ts";

const ROWS_PER_SHEET_FLOOR = 300;

function containsSalaryKeyword(row: NormalizedRow): boolean {
  const desc = (row.raw_description || "").toLowerCase();
  for (const k of SALARY_KEYWORDS) {
    if (desc.includes(k.toLowerCase())) return true;
  }
  return false;
}

/** Group rows by (source, sheet) and apply trim with salary priority. */
function trimWithSalaryPriority(rows: NormalizedRow[]): {
  kept: NormalizedRow[];
  warnings: string[];
} {
  const groups = new Map<string, NormalizedRow[]>();
  for (const r of rows) {
    const key = `${r.source}/${r.file_id}/${r.sheet}`;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }

  const kept: NormalizedRow[] = [];
  const warnings: string[] = [];

  for (const [key, group] of groups) {
    if (group.length <= ROWS_PER_SHEET_FLOOR) {
      kept.push(...group);
      continue;
    }

    // Partition: salary rows first, then the rest.
    const salaryRows: NormalizedRow[] = [];
    const otherRows: NormalizedRow[] = [];
    for (const r of group) {
      (containsSalaryKeyword(r) ? salaryRows : otherRows).push(r);
    }

    // Keep ALL salary rows (don't ever drop these), then fill to floor with others.
    const keepCount = Math.max(ROWS_PER_SHEET_FLOOR, salaryRows.length);
    const remainingSlots = Math.max(0, keepCount - salaryRows.length);
    const keptOthers = otherRows.slice(0, remainingSlots);

    kept.push(...salaryRows, ...keptOthers);

    const dropped = group.length - (salaryRows.length + keptOthers.length);
    if (dropped > 0) {
      warnings.push(`${key}: trimmed ${dropped} rows (kept ${salaryRows.length} salary + ${keptOthers.length} other)`);
    }
  }

  return { kept, warnings };
}

export function extractFacts(rows: NormalizedRow[], context: Context): Facts {
  const { kept, warnings } = trimWithSalaryPriority(rows);

  const months = new Set<string>();
  const filesPresent = { bank: false, credit_card: false };

  for (const r of kept) {
    if (r.date && r.date.length >= 7) months.add(r.date.slice(0, 7));
    if (r.source === "bank") filesPresent.bank = true;
    if (r.source === "credit_card") filesPresent.credit_card = true;
  }

  return {
    rows: kept,
    months_covered: Array.from(months).sort(),
    files_present: filesPresent,
    known_merchants_matched: [], // populated lazily by build_report_model via classify decisions
    parser_warnings: warnings,
    context
  };
}
