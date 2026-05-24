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

  // Big visible banner when we're rendering the demo/mock report
  // (frontend fallback when the backend is unreachable). Prevents the
  // user from mistaking realistic-looking Hebrew vendor names in the
  // mock ("אמדוקס", "ינון", "משכנתא") for things actually parsed from
  // their file.
  const mockBanner = model.is_mock
    ? el("div", {
        style:
          "background:#fef3c7;border:1px solid #fbbf24;border-radius:12px;" +
          "padding:14px 18px;margin-bottom:18px;color:#854d0e;font-weight:600;",
      },
        el("div", { style: "font-size:15px;margin-bottom:4px;" },
          "⚠ זה דוח דמו, לא הקבצים שלך"),
        el("div", { style: "font-size:13px;font-weight:500;color:#92400e;" },
          "השרת לא הגיב לקבצים ששלחת, אז אנחנו מראים דוגמה כדי שתראי איך הדוח נראה. " +
          "השמות, הסכומים והקטגוריות בדוח הזה הם המצאה."),
      )
    : null;

  // Parser warnings — if the parser had trouble with some rows, surface
  // it so the user knows the report might be partial.
  const warnings = Array.isArray(model.parser_warnings) ? model.parser_warnings : [];
  const warningsBanner = warnings.length > 0
    ? el("div", {
        style:
          "background:#fef3c7;border:1px solid #fde68a;border-radius:10px;" +
          "padding:12px 16px;margin-bottom:18px;color:#854d0e;font-size:13px;",
      },
        el("strong", { style: "display:block;margin-bottom:4px;" },
          `${warnings.length} אזהרות מפענוח הקבצים:`),
        el("ul", { style: "margin:0;padding-inline-start:18px;" },
          ...warnings.slice(0, 5).map(w => el("li", {}, w)),
        ),
      )
    : null;

  return el("div", { class: "report-header" },
    mockBanner,
    warningsBanner,
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
      evidence: f.evidence || [],
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
      evidence: d.evidence || [],
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
      evidence: f.evidence || [],
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
      evidence: r.evidence || [],
    });
  }
  return items.filter(i => i.months_present >= 2 && i.monthly > 0);
}

// ---- per-vendor monthly history + anomaly detection ---------------
// The pipeline puts each transaction that contributed to a vendor's
// monthly total into `evidence: [{date, amount}]`. We use that here to
// build the collapsible per-month breakdown and flag obvious oddities:
//   - "spike": one month's total is ≥ 2× the median and ≥ 50 ₪ above it
//   - "duplicate": ≥ 2 charges within the same calendar month
//   - "gap": a skipped month between the first and last present months

const HEBREW_MONTHS = ["", "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
                       "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];

function formatMonthShort(yyyymm) {
  const [y, m] = String(yyyymm || "").split("-");
  const idx = parseInt(m, 10);
  if (!idx || !HEBREW_MONTHS[idx]) return yyyymm || "";
  return `${HEBREW_MONTHS[idx]} '${(y || "").slice(2)}`;
}

function groupEvidenceByMonth(evidence) {
  const map = new Map();
  for (const e of evidence || []) {
    const month = String(e.date || "").slice(0, 7);
    if (!month) continue;
    const entry = map.get(month) || { total: 0, count: 0 };
    entry.total += Math.abs(e.amount || 0);
    entry.count += 1;
    map.set(month, entry);
  }
  return map;
}

function detectVendorAnomalies(monthsMap) {
  const months = Array.from(monthsMap.keys()).sort();
  if (months.length === 0) return { spikes: new Set(), duplicates: new Set(), gaps: [] };

  const totals = months.map(m => monthsMap.get(m).total);
  const sorted = totals.slice().sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  const spikes = new Set();
  for (const m of months) {
    const t = monthsMap.get(m).total;
    // Require both a 2× ratio AND a meaningful absolute delta so a jump
    // from 5 ₪ to 12 ₪ doesn't get flagged as a "spike".
    if (median > 0 && t >= 2 * median && t - median >= 50) spikes.add(m);
  }

  const duplicates = new Set();
  for (const m of months) {
    if (monthsMap.get(m).count >= 2) duplicates.add(m);
  }

  const gaps = [];
  for (let i = 1; i < months.length; i++) {
    const [py, pm] = months[i - 1].split("-").map(Number);
    const [cy, cm] = months[i].split("-").map(Number);
    const diff = (cy - py) * 12 + (cm - pm);
    if (diff > 1) gaps.push({ after: months[i - 1], before: months[i], missing: diff - 1 });
  }

  return { spikes, duplicates, gaps };
}

function renderRecurringBreakdown(model, handlers) {
  const recurring = collectRecurringItems(model);
  if (recurring.length === 0) return null;

  const cancelled = handlers?.cancelled instanceof Set ? handlers.cancelled : new Set();
  const onToggle = typeof handlers?.onToggleCancel === "function" ? handlers.onToggleCancel : null;
  const onClear = typeof handlers?.onClearCancelled === "function" ? handlers.onClearCancelled : null;

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
  const cancelledItems = recurring.filter(it => cancelled.has(it.label));
  const cancelledTotal = cancelledItems.reduce((s, it) => s + it.monthly, 0);

  const savingsBanner = cancelledItems.length > 0
    ? el("div", {
        style: "margin:14px 0 18px;padding:14px 18px;background:var(--surplus-soft);border:1px solid #6ee7b7;border-radius:12px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;",
      },
        el("div", {},
          el("strong", { style: "color:var(--surplus);font-size:16px;" },
            `אם תבטלו את אלה: ${formatILS(cancelledTotal)} בחודש`,
          ),
          el("div", { style: "font-size:13px;color:var(--text-secondary);margin-top:2px;" },
            `${cancelledItems.length} פריטים מסומנים לביטול · ${formatILS(cancelledTotal * 12)} בשנה`,
          ),
        ),
        onClear
          ? el("button", {
              class: "btn btn-ghost",
              style: "font-size:13px;padding:6px 12px;",
              onclick: onClear,
            }, "נקה הכל")
          : null,
      )
    : null;

  return el("section", { class: "report-section card" },
    el("h2", { class: "section-title" }, "הוצאות חוזרות לפי ספק"),
    el("p", { class: "text-secondary mb-16", style: "margin-top:0;font-size:14px;" },
      `${grandCount} ספקים שחוזרים לפחות בחודשיים — ${formatILS(grandTotal)} סך הכל בחודש.`,
      onToggle
        ? el("span", { class: "text-tertiary", style: "display:block;margin-top:4px;font-size:13px;" },
            "סמנו את מה שהייתם רוצים לבטל כדי לראות כמה תחסכו.")
        : null,
    ),
    savingsBanner,
    ...groups.map(g => el("div", { style: "margin-bottom:18px;" },
      el("div", {
        style: "display:flex;justify-content:space-between;align-items:baseline;padding:8px 0;border-bottom:1px solid var(--border);font-weight:600;",
      },
        el("span", {}, `${g.cat} · ${g.count}`),
        el("span", { style: "font-variant-numeric:tabular-nums;" }, `${formatILS(g.total)}/חודש`),
      ),
      ...g.items.map(it => renderVendorRow(it, { cancelled, onToggle })),
    )),
  );
}

function renderVendorRow(it, { cancelled, onToggle }) {
  const isCancelled = cancelled.has(it.label);
  const monthsMap = groupEvidenceByMonth(it.evidence);
  const anomalies = detectVendorAnomalies(monthsMap);
  const hasHistory = monthsMap.size > 0;
  const hasAnomaly = anomalies.spikes.size > 0 || anomalies.duplicates.size > 0 || anomalies.gaps.length > 0;
  const orderedMonths = Array.from(monthsMap.keys()).sort();

  const checkbox = onToggle
    ? el("input", {
        type: "checkbox",
        checked: isCancelled ? "checked" : null,
        onchange: (e) => { e.stopPropagation(); onToggle(it.label); },
        // Stop click from bubbling to <summary>, which would toggle expansion.
        onclick: (e) => e.stopPropagation(),
      })
    : null;

  const summaryChildren = [
    checkbox,
    el("span", { class: "vendor-label" }, it.label),
    hasAnomaly
      ? el("span", { class: "vendor-anomaly-chip", title: "יש כאן משהו לבדוק — לחצו להרחבה" }, "⚠ לבדיקה")
      : null,
    el("span", { class: "vendor-months-count" }, `${it.months_present} חודשים`),
    el("span", { class: "vendor-monthly" }, formatILS(it.monthly)),
  ].filter(Boolean);

  // If there's no per-transaction evidence we can't build a useful body —
  // fall back to a non-expandable row so we don't show an empty disclosure.
  if (!hasHistory) {
    return el("div", {
      class: "vendor-row vendor-row-static" + (isCancelled ? " is-cancelled" : ""),
    }, ...summaryChildren);
  }

  const body = el("div", { class: "vendor-row-body" },
    el("ul", { class: "vendor-month-list" },
      ...orderedMonths.map(m => {
        const info = monthsMap.get(m);
        const isSpike = anomalies.spikes.has(m);
        const isDup = anomalies.duplicates.has(m);
        return el("li", { class: "vendor-month-row" },
          el("span", { class: "vendor-month-name" }, formatMonthShort(m)),
          el("span", { class: "vendor-month-amount" }, formatILS(info.total)),
          isDup ? el("span", { class: "vendor-month-badge dup" }, `× ${info.count} חיובים`) : null,
          isSpike ? el("span", { class: "vendor-month-badge spike" }, "↑ זינוק") : null,
        );
      }),
    ),
    hasAnomaly
      ? el("div", { class: "vendor-anomaly-notes" },
          anomalies.duplicates.size > 0
            ? el("div", { class: "vendor-anomaly-note" },
                "🔍 ",
                el("strong", {}, "כפל חיוב באותו חודש: "),
                Array.from(anomalies.duplicates).sort().map(formatMonthShort).join(", "),
                " — שווה לבדוק אם זה כפילות, מכשירים שונים, או שני מנויים נפרדים.")
            : null,
          anomalies.spikes.size > 0
            ? el("div", { class: "vendor-anomaly-note" },
                "📈 ",
                el("strong", {}, "זינוק בחיוב: "),
                Array.from(anomalies.spikes).sort().map(formatMonthShort).join(", "),
                " — לפחות פי 2 מהחודש החציוני. שדרוג חבילה? חיוב שנתי?")
            : null,
          anomalies.gaps.length > 0
            ? el("div", { class: "vendor-anomaly-note" },
                "⏭ ",
                el("strong", {}, "חודש חסר: "),
                anomalies.gaps.map(g =>
                  `${g.missing === 1 ? "חודש" : g.missing + " חודשים"} בין ${formatMonthShort(g.after)} ל-${formatMonthShort(g.before)}`
                ).join(" · "),
                " — לבדוק אם בוטל, הופסק זמנית, או שזה לא חיוב חודשי קבוע.")
            : null,
        )
      : null,
  );

  return el("details", {
    class: "vendor-row" + (isCancelled ? " is-cancelled" : ""),
  },
    el("summary", { class: "vendor-row-summary" }, ...summaryChildren),
    body,
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
      const recurring = renderRecurringBreakdown(m, handlers);
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
