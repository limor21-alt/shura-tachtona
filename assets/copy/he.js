// Hebrew copy — single source of truth for all UI strings.
// Numbers are interpolated by the renderer, never by Claude.

export const COPY = {
  brand: "שורה תחתונה",

  steps: {
    landing: "פתיחה",
    context: "פרטים",
    upload: "העלאה",
    processing: "עיבוד",
    clarification: "הבהרות",
    report: "דוח",
    export: "ייצוא"
  },

  // ---- LANDING (static HTML primary; this object kept for parity)----
  landing: {
    cta: "התחילו את הבדיקה",
    cta_micro: "כ־5 דקות · חינם · ללא הרשמה"
  },

  context: {
    title: "כמה פרטים שיעזרו לנו לא לטעות בדוח",
    sub: "נקצר עד המקסימום — שואלים רק מה שעוזר לדוח להיות מדויק.",
    name_label: "איך לקרוא לכם?",
    name_placeholder: "שם פרטי",
    structure_label: "מבנה משק הבית",
    structure_options: {
      single: "יחיד/ה",
      couple: "זוג",
      family: "משפחה עם ילדים",
      single_parent: "הורה יחיד/ה"
    },
    partner_label: "שם בן/בת הזוג (אופציונלי)",
    partner_placeholder: "לדוגמה: ינון",
    partner_hint: "עוזר לזהות העברות פנימיות וכינויי משכורת.",
    children_label: "שמות הילדים (אופציונלי, מופרדים בפסיק)",
    children_placeholder: "לדוגמה: נועה, איתי",
    variable_income_label: "האם יש בבית הכנסה שאינה משכורת קבועה?",
    variable_income_options: {
      yes: "כן",
      no: "לא",
      unknown: "לא בטוח/ה"
    },
    transfers_label: "האם יש העברות סדירות מבן/בת זוג או מחשבון עסקי?",
    transfers_options: {
      yes: "כן",
      no: "לא",
      unknown: "לא בטוח/ה"
    },
    files_label: "אילו קבצים מתכננים להעלות?",
    files_options: {
      bank: "עו״ש",
      credit_card: "כרטיסי אשראי",
      both: "שניהם"
    },
    next: "המשך להעלאה"
  },

  upload: {
    title: "העלו דוחות בנק ואשראי",
    sub: "כדי לקבל תמונה מלאה, עדיף להעלות 3 חודשים של עו״ש וכרטיסי אשראי.",
    explain_bank: "עו״ש עוזר לזהות הכנסות, שיקים, הלוואות, העברות, עמלות בנק וחיובי אשראי פנימיים.",
    explain_cc: "קבצי אשראי עוזרים לזהות סופר, מסעדות, וולט, מנויים, פארם/רפואי וחיובים חוזרים.",
    drop_main: "גררו לכאן את הקבצים, או לחצו לבחירה",
    drop_sub: "Excel בלבד (.xlsx · .xls). הקבצים נשארים בדפדפן עד שתאשרו ניתוח.",
    privacy: "הקבצים משמשים לניתוח בלבד. אנחנו לא מתחברים לבנק ולא מבקשים סיסמאות.",
    type_bank: "עו״ש",
    type_cc: "אשראי",
    type_unknown: "לא ידוע",
    remove: "הסר",
    only_cc_warning: "נוכל לנתח הוצאות אשראי, אבל לא לחשב שורה תחתונה מלאה בלי עו״ש.",
    only_bank_warning: "נוכל לראות תזרים והכנסות, אבל לא את פירוט ההוצאות בכרטיסי אשראי.",
    cta: "נתחו את הקבצים",
    back: "חזרה"
  },

  processing: {
    title: "עוברים על הקבצים שלכם",
    sub: "זה לוקח כמה שניות. אין צורך לרענן.",
    steps: [
      "קוראים את הקבצים",
      "מזהים הכנסות והוצאות",
      "מפרידים קבוע ממשתנה",
      "מונעים ספירה כפולה של אשראי",
      "בודקים אם יש תנועות שצריך להבהיר",
      "מכינים את הדוח"
    ]
  },

  clarification: {
    preamble_title: "עברנו על הקבצים ומצאנו כמה דברים שיכולים לשנות את החישוב",
    preamble_sub: "מצאנו תנועות שיכולות לשנות את החישוב לפני שנציג דוח מלא. ענו רק אם אתם יודעים. אם לא בטוחים, אפשר לבחור 'לא יודעת'.",
    title: "לפני הדוח המלא, צריך להבין כמה דברים",
    dontknow: "לא יודעת",
    yes: "כן",
    no: "לא",
    continue: "המשך לדוח",
    skip_all: "דלגי לדוח (יסומן כלא ידוע)"
  },

  report: {
    sections: {
      work_done: "עברנו על הדוחות בשבילכם",
      summary: "השורה התחתונה",
      meaning: "מה זה אומר בפועל",
      priority: "מה לבדוק קודם",
      improvements: "איפה אפשר לשפר",
      findings: "פירוט לפי תחומים",
      non_blocking: "דברים שכדאי לסווג בהמשך",
      audit: "איך הסיווגים השפיעו על הדוח",
      export: "הורדה וייצוא"
    },
    eyebrow_full: "דוח מלא",
    eyebrow_partial_credit: "ניתוח חלקי — רואים הוצאות אשראי, אבל לא הכנסות ועו״ש",
    eyebrow_partial_bank: "ניתוח חלקי — רואים תזרים בנק, אבל לא פירוט אשראי",
    eyebrow_low_confidence: "מה אפשר לראות כרגע",
    confidence: {
      high: "אמינות גבוהה",
      medium: "אמינות בינונית",
      low: "אמינות נמוכה"
    },
    gap_labels: {
      surplus: "עודף מחושב",
      deficit: "חוסר חודשי",
      balanced: "מאוזן"
    },
    work_done_meta: {
      files: "קבצים",
      months: "חודשים",
      transactions: "תנועות נסקרו",
      cc_dedup: "חיובי אשראי שלא נספרו פעמיים",
      one_time_excluded: "פריטים חד־פעמיים שלא נכללו בחישוב החודשי"
    },
    summary_numbers: {
      income_fixed: "הכנסה קבועה לחודש",
      income_variable: "הכנסה משתנה",
      expenses: "הוצאות לחודש",
      gap: "השורה התחתונה"
    },
    variable_caption: "₪{min}-₪{max} בחודשים שבהם הופיעה",
    one_time_caption: "₪{amount} · חד־פעמי · לא נספר כהכנסה חודשית",
    no_evidence_fallback: "לא הצלחנו לפרק את הסכום לפי ספקים בצורה אמינה.",
    export_json: "הורדת JSON",
    export_pdf: "הדפסה / שמירה כ-PDF",
    export_csv: "הורדת CSV (יומן סיווגים)",
    export_intro: "אפשר לשמור את הדוח אצלכם — להשוואה בעתיד, או לשיתוף עם בן/בת זוג.",
    review_non_blocking: "סקירת הפריטים בסוף"
  },

  // Fallback copy used when Claude output is rejected by the validator.
  fallback: {
    headline_surplus: "מצאנו עודף חודשי, אבל הוא לא בהכרח מורגש בחשבון.",
    headline_deficit: "ההוצאות החודשיות גבוהות מההכנסה הקבועה.",
    headline_balanced: "ההכנסות וההוצאות החודשיות שלכם קרובות זו לזו.",
    headline_variable: "התמונה החודשית תלויה בהכנסה משתנה — הצגנו שני תרחישים.",
    meaning_default: "הדוח מבוסס על הקבצים שהעלאתם. הוא לא ייעוץ פיננסי — מטרתו לתת תמונה ברורה ראשונה.",
    work_done_default: [
      "קראנו את כל התנועות מהקבצים שהעלאתם",
      "הפרדנו הכנסה קבועה מהכנסה משתנה",
      "סימנו פריטים חד־פעמיים שאינם חלק מהשגרה החודשית",
      "מנענו ספירה כפולה של חיובי אשראי בעו״ש"
    ]
  },

  errors: {
    no_files: "צריך להעלות לפחות קובץ אחד.",
    parse_failed: "לא הצלחנו לקרוא את הקובץ. ודאו שזה קובץ Excel תקין.",
    network: "תקלת רשת. אפשר לנסות שוב?"
  }
};

export const formatILS = (n) => {
  if (n == null || isNaN(n)) return "—";
  const abs = Math.abs(Math.round(n));
  return "₪" + abs.toLocaleString("he-IL");
};

export const formatRange = (min, max) => {
  return `₪${Math.round(min).toLocaleString("he-IL")}-₪${Math.round(max).toLocaleString("he-IL")}`;
};
