// Stage B — deterministic rule-based classifier.
//
// Phase 2 skeleton. Rule order (Phase 3 implementation):
//   utilities → known_merchants → salary (employer match) →
//   partner_salary heuristic → savings/one-time income →
//   CC-charge-in-bank → debt → BIT/PayBox →
//   medical/kids/beauty (one-time small) → wolt/restaurants →
//   subscriptions → flexible → review_only
//
// Each rule runs against raw_description. The first rule that matches
// wins; ties broken by listed order above.

import type { Classification, Facts } from "../schema.ts";

export function classify(facts: Facts): Classification {
  // Phase 2: empty classification. Phase 3 populates from rules.
  return {
    decisions: [],
    cc_dedup_report: {
      bank_charges_excluded: [],
      cc_file_total: 0,
      bank_direct_expenses_total: 0
    }
  };
}
