// Renders a report_model into DOM.
// Section order is fixed by the product spec — do not reorder.
// All numbers come from the model. Copy strings come pre-validated.

import { COPY, formatILS, formatRange } from "./copy/he.js";

// --- helpers ---
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "html") node.innerHTML = v;
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v != null) {
      node.setAttribute(k, v);
    }
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

// Validator: hide /חודש on one-time labels at render time as a last-resort
// guard. The real defense lives in the server-side validator (Phase 3).
function safeLabel(label, isOneTime) {
  if (!isOneTime) return label;
  return label.replace(/\s*\/?\s*חודש/g, "").trim();
}

// --- section renderers ---

function renderReportHeader(model) {
  const eyebrowKey = {
    full: "eyebrow_full",
    partial_credit_only: "eyebrow_partial_credit",
    partial_bank_only:   "eyebrow_partial_bank",
    low_confidence:      "eyebrow_low_confidence"
  }[model.report_type] || "eyebrow_full";

  return el("div", { class: "report-header" },
    el("div", { class: "report-eyebrow" },
      el("span", { class: `confidence-badge ${model.data_confidence}` },
        COPY.report.confidence[model.data_confidence] || ""),
      COPY.report[eyebrowKey]
    )
  );
}

function renderWorkDone(model) {
  const w = model.work_done;
  return el("section", { class: "report-section card" },
    el("h2", { class: "section-title" }, COPY.report.sections.work_done),
    el("ul", { class: "work-done-list" },
      ...w.bullets_copy.map(line => el("li", {}, line))
    ),
    el("div", { class: "work-done-meta" },
      el("span", {}, el("strong", {}, String(w.files_analyzed.length)), " ", COPY.report.work_done_meta.files),
      el("span", {}, el("strong", {}, String(w.months_covered)), " ", COPY.report.work_done_meta.months),
      el("span", {}, el("strong", {}, w.transactions_reviewed.toLocaleString("he-IL")), " ", COPY.report.work_done_meta.transactions),
      w.cc_charges_deduplicated > 0
        ? el("span", {}, el("strong", {}, String(w.cc_charges_deduplicated)), " ", COPY.report.work_done_meta.cc_dedup)
        : null,
      w.one_time_items_excluded > 0
        ? el("span", {}, el("strong", {}, String(w.one_time_items_excluded)), " ", COPY.report.work_done_meta.one_time_excluded)
        : null
    )
  );
}

function renderSummary(model) {
  const s = model.summary;
  const statusClass = model.summary_status; // surplus | deficit | balanced | variable_dependent

  const numbers = el("div", { class: "summary-numbers" });

  numbers.appendChild(el("div", { class: "num-block" },
    el("div", { class: "num-label" }, COPY.report.summary_numbers.income_fixed),
    el("div", { class: "num-value" }, formatILS(s.monthly_income_fixed))
  ));

  if (s.monthly_income_variable_range) {
    const r = s.monthly_income_variable_range;
    numbers.appendChild(el("div", { class: "num-block" },
      el("div", { class: "num-label" }, COPY.report.summary_numbers.income_variable),
      el("div", { class: "num-value" }, formatRange(r.min, r.max)),
      el("div", { class: "num-label", style: "margin-top:4px;" },
        `בחודשים שבהם הופיעה (${r.months_present})`)
    ));
  }

  numbers.appendChild(el("div", { class: "num-block" },
    el("div", { class: "num-label" }, COPY.report.summary_numbers.expenses),
    el("div", { class: "num-value" }, formatILS(s.monthly_expenses_total))
  ));

  const gapClass = s.monthly_gap > 0 ? "surplus" : s.monthly_gap < 0 ? "deficit" : "";
  numbers.appendChild(el("div", { class: `num-block ${gapClass}` },
    el("div", { class: "num-label" }, s.gap_label),
    el("div", { class: "num-value" }, formatILS(Math.abs(s.monthly_gap)))
  ));

  const sections = [
    el("h2", { class: "section-title" }, COPY.report.sections.summary),
    el("h3", { class: "summary-headline" }, s.headline_copy)
  ];

  if (model.display_mode === "two_scenarios" && s.scenarios) {
    sections.push(
      el("div", { class: "scenarios-grid" },
        ...s.scenarios.map(sc => {
          const gc = sc.gap > 0 ? "surplus" : sc.gap < 0 ? "deficit" : "";
          const gLabel = sc.gap > 0 ? COPY.report.gap_labels.surplus
                       : sc.gap < 0 ? COPY.report.gap_labels.deficit
                       : COPY.report.gap_labels.balanced;
          return el("div", { class: "scenario-card" },
            el("div", { class: "scenario-name" }, sc.name),
            el("div", { class: `scenario-gap ${gc}` },
              `${gLabel} ${formatILS(Math.abs(sc.gap))}`),
            el("div", { class: "scenario-detail" },
              `הכנסה ${formatILS(sc.income)} · הוצאה ${formatILS(sc.expenses)}`)
          );
        })
      )
    );
  }

  sections.push(numbers);

  return el("section", { class: `report-section summary-card ${statusClass}` }, ...sections);
}

function renderMeaning(model) {
  const text = model.summary.meaning_copy;
  if (!text) return null;
  return el("section", { class: "report-section card" },
    el("h2", { class: "section-title" }, COPY.report.sections.meaning),
    el("p", { class: "text-secondary", style: "margin:0;" }, text)
  );
}

function renderPriorityChecks(model) {
  const list = model.priority_checks || [];
  if (list.length === 0) return null;
  return el("section", { class: "report-section card" },
    el("h2", { class: "section-title" }, COPY.report.sections.priority),
    ...list.map(c => el("div", { class: "check-item" },
      el("div", { class: "check-item-title" }, c.title),
      el("div", { class: "check-item-why" }, c.why_it_matters),
      c.copy_blurb ? el("div", { class: "check-item-why" }, c.copy_blurb) : null,
      c.suggested_action ? el("div", { class: "check-item-action" }, c.suggested_action) : null
    ))
  );
}

function renderImprovements(model) {
  const list = model.improvement_opportunities || [];
  if (list.length === 0) return null;
  return el("section", { class: "report-section card" },
    el("h2", { class: "section-title" }, COPY.report.sections.improvements),
    ...list.map(i => el("div", { class: "check-item" },
      el("div", { class: "check-item-title" },
        i.title,
        " · ",
        el("span", { class: "text-tertiary", style: "font-weight:500;" }, i.amount_label)
      ),
      i.copy_blurb ? el("div", { class: "check-item-why" }, i.copy_blurb) : null,
      i.evidence_strength === "review_only"
        ? el("div", { class: "text-tertiary", style: "font-size:12px;margin-top:6px;" },
            "טעון בדיקה — לא מוצג כחיסכון ודאי")
        : null
    ))
  );
}

function renderFindingsByArea(model) {
  const list = model.findings_by_area || [];
  if (list.length === 0) return null;
  const hasAnyAmount = list.some(a => a.monthly_avg > 0);
  return el("section", { class: "report-section card" },
    el("h2", { class: "section-title" }, COPY.report.sections.findings),
    hasAnyAmount
      ? el("div", {},
          ...list.map(a => el("div", { class: "area-row" },
            el("span", { class: "area-name" }, a.area),
            el("span", { class: "area-amount" },
              a.evidence_strength === "review_only"
                ? el("span", { class: "area-evidence-weak" }, "טעון בדיקה")
                : null,
              formatILS(a.monthly_avg)
            )
          ))
        )
      : el("div", { class: "evidence-fallback" }, COPY.report.no_evidence_fallback)
  );
}

function renderNonBlocking(model) {
  const list = model.non_blocking_items || [];
  if (list.length === 0) return null;
  return el("section", { class: "report-section card" },
    el("h2", { class: "section-title" }, COPY.report.sections.non_blocking),
    el("p", { class: "text-secondary mb-16", style: "margin-top:0;font-size:14px;" },
      "פריטים שלא חוסמים את הדוח. תוכלי לסקור אותם בכל זמן."),
    el("ul", { class: "nb-list" },
      ...list.map(item => el("li", { class: "nb-item" },
        el("span", { class: "nb-label" }, safeLabel(item.label, true)),
        el("span", { class: "nb-amount" }, formatILS(item.amount)),
        el("span", { class: "nb-suggested" }, item.suggested_category)
      ))
    )
  );
}

function renderAuditTrail(model) {
  const a = model.classification_audit_trail;
  if (!a) return null;
  return el("details", { class: "collapsible" },
    el("summary", {}, COPY.report.sections.audit),
    el("div", { class: "collapsible-body" },
      el("h3", { class: "subsection-title", style: "margin-top:12px;" }, "חוקים שהופעלו"),
      ...(a.rules_fired || []).map(r => el("div", { class: "audit-row" },
        el("span", {}, `${r.rule_id} → ${r.decision}`),
        el("span", {}, r.row_ref || "")
      )),
      a.user_overrides && a.user_overrides.length
        ? [
            el("h3", { class: "subsection-title", style: "margin-top:16px;" }, "השפעת התשובות שלכם"),
            ...a.user_overrides.map(u => el("div", { class: "audit-row" },
              el("span", {}, `${u.question_id}: ${u.before} → ${u.after}`),
              el("span", {}, "")
            ))
          ]
        : null,
      a.excluded_items && a.excluded_items.length
        ? [
            el("h3", { class: "subsection-title", style: "margin-top:16px;" }, "פריטים שהוצאו מהחישוב"),
            ...a.excluded_items.map(x => el("div", { class: "audit-row" },
              el("span", {}, x.reason),
              el("span", {}, x.row_ref || "")
            ))
          ]
        : null
    )
  );
}

function renderExport(model, onExportJson) {
  return el("section", { class: "report-section card" },
    el("h2", { class: "section-title" }, COPY.report.sections.export),
    el("p", { class: "text-secondary", style: "margin:0 0 16px;font-size:14px;" },
      "אפשר להוריד את הדוח כקובץ ולחזור אליו בכל זמן."),
    el("div", { class: "btn-row", style: "margin-top:0;" },
      el("button", { class: "btn btn-secondary", onclick: onExportJson },
        COPY.report.export_json)
    )
  );
}

// --- main entry ---
export function renderReport(model, handlers = {}) {
  const root = el("div", { class: "screen-wide" });

  root.appendChild(renderReportHeader(model));
  root.appendChild(renderWorkDone(model));
  root.appendChild(renderSummary(model));

  const meaning = renderMeaning(model);          if (meaning) root.appendChild(meaning);
  const pri     = renderPriorityChecks(model);   if (pri)     root.appendChild(pri);
  const imp     = renderImprovements(model);     if (imp)     root.appendChild(imp);
  const areas   = renderFindingsByArea(model);   if (areas)   root.appendChild(areas);
  const nb      = renderNonBlocking(model);      if (nb)      root.appendChild(nb);

  // Audit trail goes near the end, always collapsed.
  const audit = renderAuditTrail(model);
  if (audit) root.appendChild(audit);

  root.appendChild(renderExport(model, handlers.onExportJson || (() => {})));

  return root;
}
