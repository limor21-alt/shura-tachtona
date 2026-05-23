// State machine + screen orchestration for Phase 1.
// Real pipeline (Edge Function super-service) wires in at Phase 5.

import { COPY } from "./copy/he.js";
import { parseFiles, detectFileType } from "./parser.js";
import { renderReport } from "./renderer.js";
import { MOCK_REPORT_MODEL, MOCK_CLARIFICATION_QUESTIONS } from "./data/mock_report.js";

// "landing" lives in static HTML for AEO/SEO. The JS state machine
// owns the in-app screens only.
const SCREENS = ["context", "upload", "processing", "clarification", "report"];

const state = {
  screen: "context",
  context: {
    user_name: "",
    household_structure: null,
    partner_name: "",
    children_names: "",
    has_variable_income: null,
    has_partner_or_business_transfers: null,
    planned_files: null
  },
  files: [],
  files_parsed: null,
  questions: [],
  answers: {},
  report_model: null
};

const root = document.getElementById("app");
const landingEl = document.getElementById("landing");

function showApp() {
  if (landingEl) landingEl.hidden = true;
  if (root) root.hidden = false;
  document.body.classList.add("in-app");
}

function showLanding() {
  if (landingEl) landingEl.hidden = false;
  if (root) root.hidden = true;
  document.body.classList.remove("in-app");
}

// Hook landing CTAs (any element with data-action="start").
document.querySelectorAll('[data-action="start"]').forEach(btn => {
  btn.addEventListener("click", () => {
    showApp();
    go("context");
  });
});

// --- small DOM helper (mirrors renderer.js) ---
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

function go(screen) {
  state.screen = screen;
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// --- step indicator ---
function renderStepIndicator() {
  const indicator = document.getElementById("step-indicator");
  if (!indicator) return;
  indicator.innerHTML = "";
  const currentIdx = SCREENS.indexOf(state.screen);
  for (let i = 0; i < SCREENS.length; i++) {
    const dot = document.createElement("span");
    dot.className = "step-dot";
    if (i < currentIdx) dot.classList.add("done");
    if (i === currentIdx) dot.classList.add("active");
    dot.title = COPY.steps[SCREENS[i]] || "";
    indicator.appendChild(dot);
  }
}

// =====================================================================
// SCREENS — landing is now static HTML; flow starts at "context"
// =====================================================================

function renderContext() {
  const ctx = state.context;

  function update(key, value) {
    ctx[key] = value;
    // Re-render to reflect selection states and conditional fields.
    render();
  }

  function choiceGrid(opts, current, onPick) {
    return el("div", { class: "choice-grid" },
      ...Object.entries(opts).map(([value, label]) =>
        el("div", {
          class: `choice-card ${current === value ? "selected" : ""}`,
          onclick: () => onPick(value)
        }, label)
      )
    );
  }

  const canContinue = !!ctx.user_name.trim() && !!ctx.household_structure;
  const showPartner = ctx.household_structure === "couple" || ctx.household_structure === "family";
  const showChildren = ctx.household_structure === "family" || ctx.household_structure === "single_parent";

  return el("div", { class: "screen" },
    el("h1", { class: "screen-title" }, COPY.context.title),
    el("p", { class: "subhero" }, COPY.context.sub),
    el("div", { class: "card" },

      el("div", { class: "form-group" },
        el("label", { class: "form-label" }, COPY.context.name_label),
        el("input", {
          class: "form-input",
          type: "text",
          placeholder: COPY.context.name_placeholder,
          value: ctx.user_name,
          oninput: (e) => { ctx.user_name = e.target.value; }
        })
      ),

      el("div", { class: "form-group" },
        el("label", { class: "form-label" }, COPY.context.structure_label),
        choiceGrid(COPY.context.structure_options, ctx.household_structure,
          v => update("household_structure", v))
      ),

      showPartner ? el("div", { class: "form-group" },
        el("label", { class: "form-label" }, COPY.context.partner_label),
        el("input", {
          class: "form-input",
          type: "text",
          placeholder: COPY.context.partner_placeholder,
          value: ctx.partner_name,
          oninput: (e) => { ctx.partner_name = e.target.value; }
        }),
        el("div", { class: "form-hint" }, COPY.context.partner_hint)
      ) : null,

      showChildren ? el("div", { class: "form-group" },
        el("label", { class: "form-label" }, COPY.context.children_label),
        el("input", {
          class: "form-input",
          type: "text",
          placeholder: COPY.context.children_placeholder,
          value: ctx.children_names,
          oninput: (e) => { ctx.children_names = e.target.value; }
        })
      ) : null,

      el("div", { class: "form-group" },
        el("label", { class: "form-label" }, COPY.context.variable_income_label),
        choiceGrid(COPY.context.variable_income_options, ctx.has_variable_income,
          v => update("has_variable_income", v))
      ),

      el("div", { class: "form-group" },
        el("label", { class: "form-label" }, COPY.context.transfers_label),
        choiceGrid(COPY.context.transfers_options, ctx.has_partner_or_business_transfers,
          v => update("has_partner_or_business_transfers", v))
      ),

      el("div", { class: "form-group" },
        el("label", { class: "form-label" }, COPY.context.files_label),
        choiceGrid(COPY.context.files_options, ctx.planned_files,
          v => update("planned_files", v))
      )
    ),
    el("div", { class: "btn-row" },
      el("button", {
        class: "btn btn-primary",
        disabled: canContinue ? null : "true",
        onclick: () => canContinue && go("upload")
      }, COPY.context.next),
      el("button", { class: "btn btn-ghost", onclick: () => showLanding() }, "חזרה")
    )
  );
}

// ----------------------------------------------------------------
function renderUpload() {
  function addFiles(fileList) {
    for (const f of fileList) {
      state.files.push({
        file: f,
        name: f.name,
        size: f.size,
        type: detectFileType(f.name)
      });
    }
    render();
  }

  function removeAt(idx) {
    state.files.splice(idx, 1);
    render();
  }

  const hasBank = state.files.some(f => f.type === "bank");
  const hasCC   = state.files.some(f => f.type === "credit_card");
  const onlyCC   = hasCC && !hasBank;
  const onlyBank = hasBank && !hasCC;
  const canAnalyze = state.files.length > 0;

  return el("div", { class: "screen" },
    el("h1", { class: "screen-title" }, COPY.upload.title),
    el("p", { class: "subhero" }, COPY.upload.sub),

    el("div", { class: "card" },
      el("h3", { class: "subsection-title" }, COPY.upload.type_bank),
      el("p", { class: "text-secondary", style: "margin:0 0 12px;font-size:14px;" }, COPY.upload.explain_bank),
      el("h3", { class: "subsection-title", style: "margin-top:16px;" }, COPY.upload.type_cc),
      el("p", { class: "text-secondary", style: "margin:0;font-size:14px;" }, COPY.upload.explain_cc)
    ),

    el("label", {
      class: "upload-zone",
      ondragover: (e) => { e.preventDefault(); e.currentTarget.classList.add("dragover"); },
      ondragleave: (e) => e.currentTarget.classList.remove("dragover"),
      ondrop: (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove("dragover");
        addFiles(e.dataTransfer.files);
      }
    },
      el("div", { class: "upload-icon" }, "⤴"),
      el("div", { style: "font-weight:600;margin-bottom:4px;" }, COPY.upload.drop_main),
      el("div", { class: "text-tertiary", style: "font-size:13px;" }, COPY.upload.drop_sub),
      el("input", {
        type: "file",
        multiple: "true",
        accept: ".xlsx,.xls",
        onchange: (e) => addFiles(e.target.files)
      })
    ),

    state.files.length > 0
      ? el("ul", { class: "file-list" },
          ...state.files.map((f, idx) => el("li", {},
            el("span", {},
              el("span", { class: "file-type-badge" },
                f.type === "bank" ? COPY.upload.type_bank :
                f.type === "credit_card" ? COPY.upload.type_cc : COPY.upload.type_unknown),
              f.name
            ),
            el("button", {
              class: "btn btn-ghost",
              style: "padding:4px 10px;font-size:13px;",
              onclick: () => removeAt(idx)
            }, COPY.upload.remove)
          ))
        )
      : null,

    (onlyCC || onlyBank) ? el("div", { class: "card-soft mt-16", style: "border-color:#fde68a;background:#fffbeb;color:#92400e;" },
        onlyCC ? COPY.upload.only_cc_warning : COPY.upload.only_bank_warning
      ) : null,

    el("div", { class: "text-secondary mt-24", style: "font-size:13px;" }, COPY.upload.privacy),

    el("div", { class: "btn-row" },
      el("button", {
        class: "btn btn-primary",
        disabled: canAnalyze ? null : "true",
        onclick: () => canAnalyze && startProcessing()
      }, COPY.upload.cta),
      el("button", { class: "btn btn-ghost", onclick: () => go("context") }, COPY.upload.back)
    )
  );
}

// ----------------------------------------------------------------
function renderProcessing() {
  const steps = COPY.processing.steps;
  // currentStep is held on state to survive re-renders during animation.
  if (state.processing_step == null) state.processing_step = 0;

  return el("div", { class: "screen text-center" },
    el("h1", { class: "screen-title" }, COPY.processing.title),
    el("p", { class: "subhero" }, COPY.processing.sub),
    el("div", { class: "card", style: "text-align:right;" },
      el("ul", { class: "process-list" },
        ...steps.map((label, i) => {
          let icon;
          let cls = "";
          if (i < state.processing_step)      { icon = el("span", { class: "check" }); cls = "done"; }
          else if (i === state.processing_step) { icon = el("span", { class: "spinner" }); cls = "active"; }
          else                                  { icon = el("span", { class: "dot-pending" }); }
          return el("li", { class: cls },
            el("span", { class: "process-icon" }, icon),
            el("span", {}, label)
          );
        })
      )
    )
  );
}

async function startProcessing() {
  state.processing_step = 0;
  go("processing");

  // Step 1: parse files (real call, but Phase 1 stub returns quickly).
  state.files_parsed = await parseFiles(state.files.map(f => f.file));
  await sleep(450);
  state.processing_step = 1; render();

  // Phase 1: simulate the rest of the pipeline.
  for (let i = 2; i <= 6; i++) {
    await sleep(550 + Math.random() * 250);
    state.processing_step = i; render();
  }

  // Phase 1: mock outcome — show clarification screen.
  // Real flow: gate.ts decides whether to show or skip.
  state.questions = MOCK_CLARIFICATION_QUESTIONS;
  state.report_model = MOCK_REPORT_MODEL;

  await sleep(300);
  if (state.questions.length > 0) {
    go("clarification");
  } else {
    go("report");
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ----------------------------------------------------------------
function renderClarification() {
  const qs = state.questions;
  const answered = qs.filter(q => state.answers[q.id] != null).length;
  const allAnswered = answered === qs.length;

  function pick(qId, value) {
    state.answers[qId] = value;
    render();
  }

  return el("div", { class: "screen" },
    el("div", { class: "card", style: "background:var(--accent-soft);border-color:#c7d2fe;" },
      el("h3", { class: "subsection-title", style: "color:var(--accent);" },
        COPY.clarification.preamble_title),
      el("p", { class: "text-secondary", style: "margin:0;font-size:14px;" },
        COPY.clarification.preamble_sub)
    ),

    el("h1", { class: "screen-title", style: "margin-top:24px;" }, COPY.clarification.title),

    ...qs.map((q, idx) => el("div", { class: "question-card" },
      el("div", { class: "question-meta" }, `שאלה ${idx + 1} מתוך ${qs.length} · ${q.meta}`),
      el("h3", { class: "question-title" }, q.title),
      el("p", { class: "question-context" }, q.context),
      el("div", { class: "answer-options" },
        ...q.options.map(opt => el("button", {
          class: `answer-pill ${state.answers[q.id] === opt.value ? "selected" : ""}`,
          onclick: () => pick(q.id, opt.value)
        }, opt.label)),
        q.allow_dontknow ? el("button", {
          class: `answer-pill dontknow ${state.answers[q.id] === "unknown" ? "selected" : ""}`,
          onclick: () => pick(q.id, "unknown")
        }, COPY.clarification.dontknow) : null
      )
    )),

    el("div", { class: "btn-row" },
      el("button", {
        class: "btn btn-primary",
        onclick: () => go("report")
      }, allAnswered ? COPY.clarification.continue : COPY.clarification.skip_all)
    )
  );
}

// ----------------------------------------------------------------
function renderReportScreen() {
  return renderReport(state.report_model, {
    onExportJson: () => downloadJson(state.report_model, "shura-tachtona-report.json")
  });
}

function downloadJson(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// =====================================================================
// ROUTER
// =====================================================================
function render() {
  root.innerHTML = "";
  let content;
  switch (state.screen) {
    case "context":       content = renderContext(); break;
    case "upload":        content = renderUpload(); break;
    case "processing":    content = renderProcessing(); break;
    case "clarification": content = renderClarification(); break;
    case "report":        content = renderReportScreen(); break;
    default:              content = renderContext();
  }
  const wrap = document.createElement("div");
  wrap.className = "container";
  wrap.appendChild(content);
  root.appendChild(wrap);
  renderStepIndicator();
}

// Debug helper: open the report directly with ?screen=report.
// Also keeps the app hidden until activated, so landing stays the default.
const params = new URLSearchParams(window.location.search);
const debugScreen = params.get("screen");
if (debugScreen && SCREENS.includes(debugScreen)) {
  if (debugScreen === "report") state.report_model = MOCK_REPORT_MODEL;
  if (debugScreen === "clarification") {
    state.questions = MOCK_CLARIFICATION_QUESTIONS;
    state.report_model = MOCK_REPORT_MODEL;
  }
  state.screen = debugScreen;
  showApp();
  render();
} else {
  // Default: landing visible, app hidden. Pre-render the first app
  // screen so the DOM is ready when the user clicks the CTA.
  render();
}
