// Phase 1 mock report_model. Demonstrates a "family with variable income"
// scenario — the most complex display mode (two scenarios) — so the renderer
// is exercised against the hardest layout first.
//
// This is the deliverable contract for the deterministic pipeline in
// Phases 2–5: the backend must produce a JSON object that matches this shape.

export const MOCK_REPORT_MODEL = {
  report_type: "full",
  data_confidence: "high",
  data_confidence_reason: "עו״ש + אשראי + 3 חודשים",

  summary_status: "variable_dependent",
  display_mode: "two_scenarios",

  summary: {
    headline_copy: "התמונה החודשית שלכם תלויה בהכנסה משתנה. בחודשים בלי ההכנסה הזו יש חוסר; בחודשים שבהם היא נכנסת — מתקבל עודף קטן.",
    meaning_copy: "המשכורת של לימור (אמדוקס) מכסה את ההוצאות הקבועות ברוב חודשי השנה. ההעברות המשתנות מינון מוסיפות סכום שיכול להפוך חוסר חודשי לעודף. כל עוד הן לא קבועות, כדאי לבנות את התקציב סביב התרחיש הזהיר.",
    monthly_income_fixed: 18420,
    monthly_income_variable_range: {
      min: 11500,
      max: 17500,
      months_present: 2
    },
    monthly_expenses_total: 19850,
    monthly_gap: -1430,
    gap_label: "חוסר חודשי",
    scenarios: [
      {
        name: "ללא הכנסה משתנה",
        income: 18420,
        expenses: 19850,
        gap: -1430
      },
      {
        name: "עם הכנסה משתנה",
        income: 18420 + 14500,
        expenses: 19850,
        gap: 13070
      }
    ]
  },

  work_done: {
    files_analyzed: [
      { type: "bank", name: "עו״ש_פועלים_מרץ-מאי.xlsx", months: 3, row_count: 287 },
      { type: "credit_card", name: "מקס_מרץ-מאי.xlsx",   months: 3, row_count: 412 },
      { type: "credit_card", name: "ישראכרט_מרץ-מאי.xlsx", months: 3, row_count: 198 }
    ],
    months_covered: 3,
    transactions_reviewed: 897,
    cc_charges_deduplicated: 6,
    one_time_items_excluded: 4,
    bullets_copy: [
      "קראנו את כל התנועות בשלושת הקבצים",
      "הפרדנו משכורת קבועה (אמדוקס) מהעברות משתנות (ינון)",
      "סימנו 4 חיובים חד־פעמיים — לא נספרים כהוצאה חודשית",
      "מנענו ספירה כפולה של 6 חיובי אשראי שמופיעים גם בעו״ש"
    ]
  },

  income_model: {
    fixed: [
      {
        label: "משכורת — אמדוקס",
        monthly_amount: 18420,
        evidence_count: 3,
        source_examples: ["משכורת מרץ", "משכורת אפריל", "משכורת מאי"]
      }
    ],
    variable: [
      {
        label: "העברה מינון",
        months_present: 2,
        range: { min: 11500, max: 17500, avg: 14500 },
        evidence: [
          { date: "2025-03-12", amount: 11500 },
          { date: "2025-05-04", amount: 17500 }
        ]
      }
    ],
    one_time_excluded: [
      {
        label: "מגדל — קרן השתלמות",
        amount: 31768,
        date: "2025-04-22",
        reason: "פדיון קרן — לא הכנסה חודשית"
      }
    ],
    internal_transfers_excluded: [],
    uncertain: []
  },

  expense_model: {
    fixed_commitments: [
      { label: "משכנתא",        monthly_amount: 5200, category: "דיור",   evidence: [] },
      { label: "ארנונה",         monthly_amount: 540,  category: "דיור",   evidence: [] },
      { label: "חברת חשמל",      monthly_amount: 410,  category: "חשבונות", evidence: [] },
      { label: "בזק / סלולר",    monthly_amount: 320,  category: "חשבונות", evidence: [] },
      { label: "ביטוח רכב",      monthly_amount: 380,  category: "ביטוחים", evidence: [] }
    ],
    debt_payments: [
      {
        label: "הלוואה — בנק הפועלים",
        monthly_amount: 1750,
        balance: 42000,
        end_date: "2027-08-01",
        evidence: []
      }
    ],
    flexible_spending: [
      { label: "סופר",     monthly_avg: 4800, category: "מזון",     evidence: [] },
      { label: "וולט ומסעדות", monthly_avg: 1900, category: "מזון בחוץ", evidence: [] },
      { label: "דלק ותחבורה", monthly_avg: 1200, category: "תחבורה",  evidence: [] }
    ],
    review_only_items: [
      {
        label: "מנויים (Netflix, Spotify, iCloud, NYT)",
        monthly_avg: 187,
        reason: "לבדוק אילו מהם בשימוש פעיל"
      },
      {
        label: "BIT / PayBox — העברות לא מסווגות",
        period_total: 1240,
        reason: "תנועות שלא ניתן לזהות מי הנמען או למה"
      }
    ],
    one_time_expenses: [
      { label: "מכבידנט",     amount: 942, date: "2025-03-18", category: "רפואי" },
      { label: "PlaySmart",   amount: 509, date: "2025-04-02", category: "ילדים" },
      { label: "Segav Skin",  amount: 500, date: "2025-04-15", category: "טיפוח" },
      { label: "תיקון מקרר",  amount: 720, date: "2025-05-09", category: "בית" }
    ],
    excluded_internal_transfers: [
      { label: "מקס חיוב",      amount: 4200, count: 3, target: "כרטיס מקס" },
      { label: "ישראכרט חיוב", amount: 2100, count: 3, target: "כרטיס ישראכרט" }
    ]
  },

  priority_checks: [
    {
      id: "pc-1",
      title: "ההכנסה מינון לא קבועה",
      why_it_matters: "אם היא לא תיכנס בחודש מסוים, יש חוסר של ₪1,430.",
      suggested_action: "לסכם איתו על סכום והעברה קבועה, או לבנות תקציב לפי תרחיש הזהיר.",
      amount_context: "₪11,500-₪17,500",
      copy_blurb: "המשכורת מאמדוקס מכסה את הקבוע אבל לא משאירה מרחב. בחודשים בלי ההעברה מינון נוצר חוסר."
    },
    {
      id: "pc-2",
      title: "העברות BIT/PayBox לא מזוהות",
      why_it_matters: "₪1,240 בשלושה חודשים שלא ברור לאן הלכו. לפני שתקבלו תמונה אמיתית — שווה לפרק.",
      suggested_action: "לעבור על האפליקציה ולסמן את הנמענים הקבועים.",
      amount_context: "₪413 בחודש בממוצע",
      copy_blurb: "נקודה עיוורת — לא חיסכון אבל גם לא חלק מהתמונה."
    },
    {
      id: "pc-3",
      title: "מנויים שלא נבדקו",
      why_it_matters: "₪187 בחודש למנויים. הפוטנציאל תלוי במה שבאמת בשימוש.",
      suggested_action: "לעבור על הרשימה ולסמן אילו פעילים.",
      amount_context: "₪187/חודש",
      copy_blurb: "מנויים לבדיקה: ₪187/חודש — פוטנציאל החיסכון תלוי במה שבאמת בשימוש."
    }
  ],

  improvement_opportunities: [
    {
      id: "io-1",
      title: "וולט ומסעדות",
      evidence_strength: "likely",
      amount_label: "₪1,900/חודש",
      copy_blurb: "סעיף שיש לכם עליו שליטה ישירה. כל הפחתה כאן מתורגמת מיידית לחוסך."
    },
    {
      id: "io-2",
      title: "סופר",
      evidence_strength: "review_only",
      amount_label: "₪4,800/חודש",
      copy_blurb: "סכום משמעותי אבל לרוב לא 'בזבוז' — שווה לבדוק אם יש פיצולים בין רשתות שאפשר לאחד."
    }
  ],

  findings_by_area: [
    { area: "דיור",     monthly_avg: 5740, items: 2, evidence_strength: "confirmed" },
    { area: "מזון",     monthly_avg: 6700, items: 2, evidence_strength: "confirmed" },
    { area: "תחבורה",   monthly_avg: 1200, items: 1, evidence_strength: "confirmed" },
    { area: "חשבונות",  monthly_avg: 730,  items: 2, evidence_strength: "confirmed" },
    { area: "ביטוחים",  monthly_avg: 380,  items: 1, evidence_strength: "confirmed" },
    { area: "חוב",      monthly_avg: 1750, items: 1, evidence_strength: "confirmed" },
    { area: "מנויים",   monthly_avg: 187,  items: 4, evidence_strength: "review_only" }
  ],

  non_blocking_items: [
    { label: "מכבידנט",   amount: 942, date: "2025-03-18", suggested_category: "רפואי",  action: "confirm" },
    { label: "PlaySmart", amount: 509, date: "2025-04-02", suggested_category: "ילדים",  action: "confirm" },
    { label: "Segav Skin", amount: 500, date: "2025-04-15", suggested_category: "טיפוח",  action: "confirm" },
    { label: "תיקון מקרר", amount: 720, date: "2025-05-09", suggested_category: "בית",    action: "confirm" }
  ],

  classification_audit_trail: {
    rules_fired: [
      { rule_id: "salary_employer_match", row_ref: "bank:row-42",  decision: "fixed_income", confidence: "high" },
      { rule_id: "partner_salary_variable", row_ref: "bank:row-71",  decision: "variable_income", confidence: "high" },
      { rule_id: "savings_onetime_migdal",  row_ref: "bank:row-118", decision: "one_time_excluded", confidence: "high" },
      { rule_id: "cc_dedup_max",            row_ref: "bank:row-55",  decision: "internal_transfer_excluded", confidence: "high" },
      { rule_id: "utility_electricity",     row_ref: "bank:row-87",  decision: "fixed_commitment", confidence: "high" },
      { rule_id: "medical_one_time_small",  row_ref: "cc:row-203",   decision: "non_blocking", confidence: "high" },
      { rule_id: "bit_paybox_review",       row_ref: "bank:row-92",  decision: "review_only", confidence: "medium" }
    ],
    user_overrides: [],
    excluded_items: [
      { row_ref: "bank:row-55",  reason: "מקס חיוב — חיוב פנימי של אשראי" },
      { row_ref: "bank:row-62",  reason: "ישראכרט חיוב — חיוב פנימי של אשראי" },
      { row_ref: "bank:row-118", reason: "מגדל — חד־פעמי, לא הכנסה חודשית" }
    ]
  },

  export_data: {
    json_blob_ref: null,
    pdf_url: null,
    csv_url: null
  },

  parser_warnings: [],
  forbidden_word_violations: []
};

// Mock clarification questions — Phase 1 demo. Real ones come from
// gate.ts in Phase 4. Capped at 5; ideal 1–3.
export const MOCK_CLARIFICATION_QUESTIONS = [
  {
    id: "q-partner-income",
    meta: "הכנסה משתנה",
    title: "האם ההעברות מינון הן משכורת קבועה?",
    context: "מצאנו 2 העברות מינון שומרוני בסכומים שונים (₪11,500 ו-₪17,500). אם זו משכורת קבועה, נחשב אחרת.",
    options: [
      { value: "fixed",    label: "כן — קבועה" },
      { value: "variable", label: "לא — משתנה" },
      { value: "internal", label: "העברה פנימית" }
    ],
    allow_dontknow: true
  },
  {
    id: "q-migdal-onetime",
    meta: "פריט חד־פעמי",
    title: "הכספים ממגדל (₪31,768) — חד־פעמיים?",
    context: "זוהי בדרך כלל קרן השתלמות או גמל. אם זה תזרים חוזר, חשוב לדעת.",
    options: [
      { value: "one_time", label: "חד־פעמי" },
      { value: "recurring", label: "חוזר" }
    ],
    allow_dontknow: true
  }
];
