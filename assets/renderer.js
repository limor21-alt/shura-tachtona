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

// Collect every expense item across categories with its monthly amount
// and how many months it appeared in. Anything appearing in ≥2 months
// is considered "recurring" and gets surfaced in its own panel.
function collectRecurringItems(model) {
  const em = model.expense_model || {};
  const items = [];
  for (const f of em.fixed_commitments || []) {
    items.push({
      label: f.label,
      monthly: f.monthly_amount,
      months_present: f.months_present ?? 0,
      occurrences: f.occurrences ?? 0,
      category: f.category || "התחייבויות קבועות",
      kind: "fixed",
    });
  }
  for (const d of em.debt_payments || []) {
    items.push({
      label: d.label,
      monthly: d.monthly_amount,
      months_present: d.months_present ?? 0,
      occurrences: d.occurrences ?? 0,
      category: "חוב והלוואות",
      kind: "debt",
    });
  }
  for (const f of em.flexible_spending || []) {
    items.push({
      label: f.label,
      monthly: f.monthly_avg,
      months_present: f.months_present ?? 0,
      occurrences: f.occurrences ?? 0,
      category: f.category || "הוצאות גמישות",
      kind: "flexible",
    });
  }
  for (const r of em.review_only_items || []) {
    items.push({
      label: r.label,
      monthly: r.monthly_avg ?? 0,
      months_present: r.months_present ?? 0,
      occurrences: r.occurrences ?? 0,
      category: /netflix|spotify|icloud|apple|disney|hbo|youtube|chatgpt|openai|מנוי/i.test(r.label)
        ? "מנויים ושירותים דיגיטליים"
        : /bit|paybox|paypal/i.test(r.label)
          ? "העברות אפליקציה"
          : "לבדיקה",
      kind: "review",
    });
  }
  return items.filter(i => i.months_present >= 2 && i.monthly > 0);
}

function renderRecurringBreakdown(model) {
  const recurring = collectRecurringItems(model);
  if (recurring.length === 0) return null;

  // Group by category, sort categories by total descending.
  const byCat = new Map();
  for (const it of recurring) {
    const arr = byCat.get(it.category) || [];
    arr.push(it);
    byCat.set(it.category, arr);
  }
  const groups = Array.from(byCat.entries())
    .map(([cat, items]) => ({
      cat,
      items: items.slice().sort((a, b) => b.monthly - a.monthly),
      total: items.reduce((s, i) => s + i.monthly, 0),
      count: items.length,
    }))
    .sort((a, b) => b.total - a.total);

  const grandTotal = groups.reduce((s, g) => s + g.total, 0);
  const grandCount = groups.reduce((s, g) => s + g.count, 0);

  return el("section", { class: "report-section card" },
    el("h2", { class: "section-title" }, "הוצאות חוזרות לפי ספק"),
    el("p", { class: "text-secondary mb-16", style: "margin-top:0;font-size:14px;" },
      `${grandCount} ספקים שחוזרים לפחות בחודשיים — ${formatILS(grandTotal)} סך הכל בחודש.`),
    ...groups.map(g => el("div", { style: "margin-bottom:18px;" },
      el("div", {
        style: "display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--border);font-weight:600;",
      },
        el("span", {}, `${g.cat} · ${g.count}`),
        el("span", { style: "font-variant-numeric:tabular-nums;" }, `${formatILS(g.total)}/חודש`),
      ),
      ...g.items.map(it => el("div", {
        style: "display:grid;grid-template-columns:1fr auto auto;gap:12px;align-items:baseline;padding:8px 0;border-bottom:1px dashed var(--border);font-size:14px;",
      },
        el("span", { class: "nb-label" }, it.label),
        el("span", {
          class: "text-tertiary",
          style: "font-size:12px;",
        }, `${it.months_present} חודשים`),
        el("span", {
          class: "area-amount",
          style: "font-variant-numeric:tabular-nums;",
        }, formatILS(it.monthly)),
      )),
    )),
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

function renderExport(model, handlers) {
  return el("section", { class: "report-section card export-section" },
    el("h2", { class: "section-title" }, COPY.report.sections.export),
    el("p", { class: "text-secondary", style: "margin:0 0 16px;font-size:14px;" },
      COPY.report.export_intro),
    el("div", { class: "btn-row", style: "margin-top:0;" },
      el("button", { class: "btn btn-primary", onclick: handlers.onExportPdf || (() => window.print()) },
        COPY.report.export_pdf),
      el("button", { class: "btn btn-secondary", onclick: handlers.onExportJson || (() => {}) },
        COPY.report.export_json),
      el("button", { class: "btn btn-ghost", onclick: handlers.onExportCsv || (() => {}) },
        COPY.report.export_csv)
    )
  );
}

// --- main entry ---
// Map playbook ReportSectionId → renderer. Used when the model arrives
// with a deterministic ui_structure.section_order from the backend.
// scenario_comparison is folded into renderSummary (display_mode handles it),
// so we render summary once even if both bottom_line and scenario_comparison
// appear in the order.
function buildSectionRenderers(handlers) {
  return {
    work_done:             (m) => renderWorkDone(m),
    bottom_line:           (m) => renderSummary(m),
    meaning:               (m) => renderMeaning(m),
    scenario_comparison:   () => null, // already inside renderSummary
    check_first:           (m) => renderPriorityChecks(m),
    control_opportunities: (m) => renderImprovements(m),
    // The recurring-vendor breakdown is the product's AHA moment:
    // consolidated per-vendor recurring spend with month-count badges,
    // grouped by category. Rendered as part of details_by_area so it
    // appears in the same slot whether or not the playbook ui_structure
    // includes it explicitly.
    details_by_area:       (m) => {
      const wrap = document.createDocumentFragment();
      const recurring = renderRecurringBreakdown(m);
      if (recurring) wrap.appendChild(recurring);
      const areas = renderFindingsByArea(m);
      if (areas) wrap.appendChild(areas);
      return wrap.childNodes.length > 0 ? wrap : null;
    },
    classify_later:        (m) => renderNonBlocking(m),
    audit_trail:           (m) => renderAuditTrail(m),
    export:                (m) => renderExport(m, handlers),
  };
}

const DEFAULT_SECTION_ORDER = [
  "work_done",
  "bottom_line",
  "meaning",
  "check_first",
  "control_opportunities",
  "details_by_area",
  "classify_later",
  "audit_trail",
  "export",
];

export function renderReport(model, handlers = {}) {
  const root = el("div", { class: "screen-wide" });

  // Header is structural (eyebrow + confidence) and not part of the
  // playbook section order — always first.
  root.appendChild(renderReportHeader(model));

  const renderers = buildSectionRenderers(handlers);
  // Prefer the deterministic order from the backend's playbook
  // selection. Fall back to the hard-coded order if the backend hasn't
  // attached ui_structure (older snapshots / pre-Phase 2 servers).
  const order = Array.isArray(model.ui_structure?.section_order) &&
                model.ui_structure.section_order.length > 0
    ? model.ui_structure.section_order
    : DEFAULT_SECTION_ORDER;

  const seen = new Set();
  for (const sectionId of order) {
    if (seen.has(sectionId)) continue;
    seen.add(sectionId);
    const fn = renderers[sectionId];
    if (!fn) continue;
    const node = fn(model);
    if (node) root.appendChild(node);
  }

  return root;
}
