// Pipeline orchestration: A → B → C → D → E → F.
//
// Each stage is pure and deterministic except F (which calls Claude
// but is post-validated). The shape of data flowing between stages
// is fixed by schema.ts.

import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ReportModel
} from "./schema.ts";
import { extractFacts } from "./extract_facts.ts";
import { classify } from "./classify/index.ts";
import { clarificationGate } from "./gate.ts";
import { applyAnswers } from "./apply_answers.ts";
import { buildReportModel } from "./build_report_model.ts";
import { writeCopy } from "./copy_writer.ts";

export async function runPipeline(req: AnalyzeRequest): Promise<AnalyzeResponse> {
  // Stage A — extract facts
  const facts = extractFacts(req.rows, req.context);

  // Stage B — classify
  const classification = classify(facts);

  // Stage C — gate (decide whether we need answers before producing a report)
  if (!req.answers || req.answers.length === 0) {
    const gate = clarificationGate(facts, classification);
    if (gate.blocking_questions.length > 0) {
      return { kind: "needs_clarification", questions: gate.blocking_questions };
    }
  }

  // Stage D — apply answers (no-op if none)
  const { classification: cls2, overrides } = applyAnswers(
    classification,
    req.answers ?? []
  );

  // Stage E — build the deterministic report model
  const model: ReportModel = buildReportModel(facts, cls2, req.answers ?? [], overrides);

  // Stage F — Claude writes short copy fields
  const copy = await writeCopy(model);
  model.summary.headline_copy   = copy.headline_copy;
  model.summary.meaning_copy    = copy.meaning_copy;
  model.work_done.bullets_copy  = copy.work_done_bullets;

  // Merge per-id blurbs back into priority_checks / improvement_opportunities
  for (const blurb of copy.priority_check_blurbs) {
    const target = model.priority_checks.find(p => p.id === blurb.id);
    if (target) target.copy_blurb = blurb.copy_blurb;
  }
  for (const blurb of copy.improvement_blurbs) {
    const target = model.improvement_opportunities.find(p => p.id === blurb.id);
    if (target) target.copy_blurb = blurb.copy_blurb;
  }

  return { kind: "report", report_model: model };
}
