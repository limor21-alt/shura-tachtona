// Shared utilities for the classification rules.
//
// All matchers operate on raw_description, never on cleaned_name.

import type { ClassificationDecision, Context, NormalizedRow } from "../schema.ts";

export interface RuleContext {
  allRows: NormalizedRow[];
  context: Context;
  /** Row -> normalized description for fast lookup. */
  normByRow: Map<NormalizedRow, string>;
}

export interface RuleResult {
  rule_id: string;
  decision: ClassificationDecision;
  confidence: "high" | "medium" | "low";
}

export type RuleFn = (row: NormalizedRow, ctx: RuleContext) => RuleResult | null;

/** Normalize a description for substring matching:
 *  lowercase, collapse whitespace, strip Hebrew niqqud/punctuation
 *  that varies between bank exports. */
export function normalizeDesc(s: string): string {
  if (!s) return "";
  return s
    .toLowerCase()
    .replace(/[֑-ׇ]/g, "")     // strip niqqud
    .replace(/[״"׳']/g, "")              // strip Hebrew quotes
    .replace(/\s+/g, " ")
    .trim();
}

/** Substring match — checks if ANY of the keywords appears in the
 *  normalized raw_description. */
export function containsAny(row: NormalizedRow, keywords: string[]): string | null {
  const norm = normalizeDesc(row.raw_description);
  for (const k of keywords) {
    if (norm.includes(normalizeDesc(k))) return k;
  }
  return null;
}

/** YYYY-MM from a row's date. */
export function monthOf(row: NormalizedRow): string {
  return row.date.slice(0, 7);
}

/** Group rows that look like the same vendor (by normalized description). */
export function similarVendorRows(
  row: NormalizedRow,
  allRows: NormalizedRow[]
): NormalizedRow[] {
  const target = normalizeDesc(row.raw_description);
  return allRows.filter(r => normalizeDesc(r.raw_description) === target);
}

/** Returns { occurrences, months_seen } for a given vendor. */
export function vendorFrequency(
  row: NormalizedRow,
  allRows: NormalizedRow[]
): { occurrences: number; months_seen: string[] } {
  const matches = similarVendorRows(row, allRows);
  const months = new Set<string>();
  for (const m of matches) months.add(monthOf(m));
  return { occurrences: matches.length, months_seen: Array.from(months).sort() };
}

/** Is this row part of a recurring monthly pattern (≥2 distinct months)? */
export function isRecurringMonthly(row: NormalizedRow, allRows: NormalizedRow[]): boolean {
  return vendorFrequency(row, allRows).months_seen.length >= 2;
}

/** Mean and stdev of absolute amounts for a vendor across months. */
export function amountVariance(
  row: NormalizedRow,
  allRows: NormalizedRow[]
): { mean: number; min: number; max: number; spreadRatio: number } {
  const same = similarVendorRows(row, allRows);
  if (same.length === 0) return { mean: 0, min: 0, max: 0, spreadRatio: 0 };
  const amts = same.map(r => Math.abs(r.amount));
  const min = Math.min(...amts);
  const max = Math.max(...amts);
  const mean = amts.reduce((s, x) => s + x, 0) / amts.length;
  const spreadRatio = mean === 0 ? 0 : (max - min) / mean;
  return { mean, min, max, spreadRatio };
}

/** Make a row_ref string: "bank:file_id:row_index". */
export function rowRef(row: NormalizedRow): string {
  return `${row.source}:${row.file_id}:${row.row_index}`;
}

/** Build the cached normByRow map. */
export function buildContext(allRows: NormalizedRow[], context: Context): RuleContext {
  const normByRow = new Map<NormalizedRow, string>();
  for (const r of allRows) normByRow.set(r, normalizeDesc(r.raw_description));
  return { allRows, context, normByRow };
}
