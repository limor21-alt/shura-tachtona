// supabase/functions/super-service/playbooks.ts
// שורה תחתונה — 24 Scenario Playbook Registry
//
// Purpose:
//   1. Deterministically classify the main report scenario.
//   2. Select secondary findings.
//   3. Control UI titles, report order, and allowed language.
//   4. Prevent Claude from inventing math, savings, or diagnosis logic.
//
// IMPORTANT:
//   Claude may use this only for microcopy.
//   Claude must NOT calculate numbers, classify income/expenses,
//   decide blocking questions, or decide surplus/deficit.

export type ReportType =
  | "full"
  | "partial_bank_only"
  | "partial_cc_only"
  | "insufficient_data";

export type SummaryStatus =
  | "healthy"
  | "surplus"
  | "surplus_not_felt"
  | "deficit"
  | "large_deficit"
  | "variable_dependent"
  | "partial_data"
  | "uncertain";

export type ScenarioKind =
  | "primary_diagnosis"
  | "secondary_finding"
  | "data_quality"
  | "risk_context";

export type HealthTone = "green" | "yellow" | "orange" | "red" | "neutral";

export type AmountType =
  | "confirmed_savings"
  | "review_amount"
  | "no_amount"
  | "fixed_commitment"
  | "excluded"
  | "uncertain";

export type ReportSectionId =
  | "work_done"
  | "bottom_line"
  | "meaning"
  | "scenario_comparison"
  | "check_first"
  | "control_opportunities"
  | "details_by_area"
  | "classify_later"
  | "audit_trail"
  | "export";

export type FindingType =
  | "income"
  | "expense"
  | "debt"
  | "subscription"
  | "payment_app"
  | "municipal"
  | "medical"
  | "food_delivery"
  | "one_time"
  | "internal_transfer"
  | "data_quality";

export type PlaybookId =
  | "partial_credit_only"
  | "partial_bank_only"
  | "insufficient_data"
  | "stable_healthy"
  | "surplus_not_felt"
  | "small_deficit"
  | "large_deficit"
  | "variable_income_dependent"
  | "missing_income"
  | "one_time_income_distortion"
  | "one_time_expense_distortion"
  | "debt_pressure"
  | "overdraft_interest"
  | "recurring_large_check"
  | "internal_transfer_risk"
  | "housing_heavy"
  | "fixed_commitments_high"
  | "food_delivery_restaurants_high"
  | "subscriptions_creep"
  | "payment_apps_blind_spot"
  | "municipal_education_review"
  | "medical_health_one_time"
  | "business_reimbursable_expenses"
  | "seasonal_family_expenses";

export type FactsForPlaybooks = {
  reportType: ReportType;
  monthsDetected: number;
  hasBankFile: boolean;
  hasCreditCardFile: boolean;

  fixedMonthlyIncome: number;
  variableIncomeMonthlyAvg: number;
  variableIncomeMin: number;
  variableIncomeMax: number;
  variableIncomeMonthsSeen: string[];

  monthlyExpenses: number;
  fixedOnlyGap: number;
  withVariableGap: number;

  oneTimeIncomeExcludedTotal: number;
  oneTimeExpenseTotal: number;

  debtBalanceTotal: number;
  debtMonthlyPaymentTotal: number;
  overdraftInterestMonthly: number;

  housingMonthly: number;
  fixedCommitmentsMonthly: number;

  woltMonthly: number;
  restaurantsMonthly: number;
  subscriptionsMonthly: number;
  subscriptionsDuplicateEvidenceAmount: number;

  paymentAppsMonthly: number;
  municipalMonthly: number;
  medicalOneTimeTotal: number;
  seasonalFamilyExpensesTotal: number;
  businessOrReimbursablePossibleTotal: number;

  recurringLargeChecksTotal: number;
  internalTransferRiskTotal: number;

  missingIncomeLikely: boolean;
  hasMaterialVariableIncome: boolean;
  dataConfidence: "high" | "medium" | "low";
};

export type PlaybookTrigger = {
  description: string;
  test: (facts: FactsForPlaybooks) => boolean;
};

export type UIBlockCopy = {
  workDoneTitle?: string;
  bottomLineTitle?: string;
  bottomLineHeadline: string;
  meaningTitle: string;
  meaningBody: string;
  checkFirstTitle: string;
  controlTitle: string;
  detailsTitle: string;
  classifyLaterTitle: string;
  auditTrailTitle: string;
};

export type PriorityActionTemplate = {
  title: string;
  whyFirst: string;
  whatToDo: string;
  amountType: AmountType;
  shouldShowAmountFrom?:
    | "woltMonthly"
    | "restaurantsMonthly"
    | "subscriptionsMonthly"
    | "paymentAppsMonthly"
    | "debtMonthlyPaymentTotal"
    | "housingMonthly"
    | "municipalMonthly"
    | "none";
};

export type Playbook = {
  id: PlaybookId;
  kind: ScenarioKind;
  priority: number;

  label: string;
  healthTone: HealthTone;

  trigger: PlaybookTrigger;

  userFear: string;
  mainAha: string;

  ui: UIBlockCopy;

  recommendedSections: ReportSectionId[];

  primaryActions: PriorityActionTemplate[];

  allowedClaims: string[];
  forbiddenClaims: string[];

  blockingGuidance: {
    canCreateBlockingQuestions: boolean;
    blockingOnlyFor: string[];
    neverBlockFor: string[];
  };

  evidenceRules: string[];

  claudeCopyHints: {
    tone: string;
    doSay: string[];
    doNotSay: string[];
  };
};

/**
 * Global report UI order.
 * This is the default for full reports.
 * Partial reports may use a shorter version.
 */
export const FINAL_REPORT_SECTION_ORDER: ReportSectionId[] = [
  "work_done",
  "bottom_line",
  "meaning",
  "scenario_comparison",
  "check_first",
  "control_opportunities",
  "details_by_area",
  "classify_later",
  "audit_trail",
  "export",
];

export const GLOBAL_LANGUAGE_RULES = {
  tone: "calm · smart · practical · human · no judgment · no panic",
  forbiddenWords: [
    "בזבוזים",
    "דורש טיפול מיידי",
    "חמור",
    "מסוכן",
    "פי X מהממוצע",
    "חייבים",
    "מוכרחים",
    "קחו הלוואה",
  ],
  surplus: {
    say: "עודף מחושב",
    neverSay: ["פער", "מינוס", "חוסר"],
  },
  deficit: {
    say: "חוסר חודשי",
    neverSay: ["חמור", "מסוכן", "דורש טיפול מיידי"],
  },
  subscriptions: {
    say: "מנויים לבדיקה",
    neverSayUnlessEvidence: "פוטנציאל חיסכון",
  },
  oneTime: {
    say: "חד־פעמי · לא נספר כהכנסה חודשית",
    neverSay: "/חודש",
  },
} as const;

export const UI_TITLES = {
  work_done: {
    title: "עברנו על הדוחות בשבילכם",
    subtitle:
      "במקום שתעברו ידנית על מאות תנועות, סידרנו את הנתונים לפי מה שבאמת משנה.",
  },
  bottom_line: { title: "השורה התחתונה שלכם" },
  meaning: { title: "מה זה אומר בפועל" },
  scenario_comparison: {
    title: "שני תרחישים",
    subtitle: "כשיש הכנסה משתנה, לא מציגים מספר אחד שמטעה.",
  },
  check_first: {
    title: "מה לבדוק קודם",
    subtitle: "לא רשימת קיצוצים. סדר פעולות לפי מה שמשפיע על התמונה.",
  },
  control_opportunities: {
    title: "איפה יש לכם שליטה",
    subtitle: "רק סעיפים שאפשר לבדוק או להחליט עליהם. לא התחייבויות קבועות.",
  },
  details_by_area: {
    title: "פירוט לפי תחומים",
    subtitle: "המספרים והראיות שמאחורי האבחון.",
  },
  classify_later: {
    title: "דברים שכדאי לסווג בהמשך",
    subtitle: "לא עצרנו בשבילם את הדוח, אבל הם יעזרו לדייק את החודש הבא.",
  },
  audit_trail: {
    title: "איך הסיווגים השפיעו על הדוח?",
    subtitle: "למי שרוצה לראות איך התשובות השפיעו על החישוב.",
  },
  export: {
    title: "רוצים לעקוב אחרי זה?",
    subtitle: "ייצוא הדוח, הסיווגים והדברים לבדיקה.",
  },
} as const;

/**
 * 24 scenarios.
 *
 * Important product decision:
 *   Not all scenarios are primary diagnosis.
 *   Some are secondary findings.
 *
 * Example:
 *   subscriptions_creep should not become the main diagnosis if the real
 *   issue is variable income, debt pressure, missing data, or large deficit.
 */
export const PLAYBOOKS: Record<PlaybookId, Playbook> = {
  // 1
  partial_credit_only: {
    id: "partial_credit_only",
    kind: "data_quality",
    priority: 1000,
    label: "ניתוח חלקי — רק כרטיסי אשראי",
    healthTone: "yellow",
    trigger: {
      description: "Credit card files exist, bank statement is missing.",
      test: (f) => f.hasCreditCardFile && !f.hasBankFile,
    },
    userFear: "אני רואה הוצאות אבל לא יודעת אם יש חוסר או עודף.",
    mainAha: "רואים הוצאות אשראי, אבל בלי עו״ש אי אפשר לחשב שורה תחתונה מלאה.",
    ui: {
      bottomLineHeadline: "ניתוח חלקי — רואים הוצאות אשראי, אבל לא הכנסות ועו״ש",
      meaningTitle: "מה אפשר להבין כרגע",
      meaningBody:
        "אפשר לראות דפוסי הוצאה, מנויים וסעיפים גמישים. אי אפשר לחשב פער חודשי מלא בלי קובץ עו״ש.",
      checkFirstTitle: "מה להשלים כדי לדייק",
      controlTitle: "מה אפשר לבדוק כבר עכשיו",
      detailsTitle: "פירוט הוצאות אשראי",
      classifyLaterTitle: "דברים שכדאי לסווג בהמשך",
      auditTrailTitle: "איך הנתונים החלקיים השפיעו על הדוח",
    },
    recommendedSections: [
      "work_done",
      "bottom_line",
      "meaning",
      "check_first",
      "control_opportunities",
      "details_by_area",
      "classify_later",
      "export",
    ],
    primaryActions: [
      {
        title: "להעלות קובץ עו״ש כדי לחשב שורה תחתונה",
        whyFirst:
          "בלי הכנסות ותנועות בנק אי אפשר לדעת אם יש עודף או חוסר.",
        whatToDo: "העלו 3 חודשים של עו״ש מאותו פרק זמן.",
        amountType: "no_amount",
      },
    ],
    allowedClaims: ["אפשר לנתח הוצאות אשראי", "אי אפשר לחשב פער מלא"],
    forbiddenClaims: ["חוסר חודשי", "עודף מחושב", "שורה תחתונה מלאה"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["subscriptions", "restaurants", "wolt", "known merchants"],
    },
    evidenceRules: ["Show credit-card evidence only.", "Do not invent income."],
    claudeCopyHints: {
      tone: "transparent and calm",
      doSay: ["ניתוח חלקי", "כדי לחשב שורה תחתונה צריך עו״ש"],
      doNotSay: ["יש חוסר", "יש עודף", "המצב חמור"],
    },
  },

  // 2
  partial_bank_only: {
    id: "partial_bank_only",
    kind: "data_quality",
    priority: 999,
    label: "ניתוח חלקי — רק עו״ש",
    healthTone: "yellow",
    trigger: {
      description: "Bank file exists, credit card files are missing.",
      test: (f) => f.hasBankFile && !f.hasCreditCardFile,
    },
    userFear: "רואים כסף נכנס ויוצא אבל לא רואים פירוט הוצאות.",
    mainAha: "רואים תזרים בנק, אבל לא את פירוט העסקאות בכרטיסי אשראי.",
    ui: {
      bottomLineHeadline: "ניתוח חלקי — רואים עו״ש, אבל לא פירוט אשראי",
      meaningTitle: "מה אפשר להבין כרגע",
      meaningBody:
        "אפשר לראות הכנסות, שיקים, הלוואות והעברות. אי אפשר לפרק את כל ההוצאות בלי קבצי אשראי.",
      checkFirstTitle: "מה להשלים כדי לדייק",
      controlTitle: "מה אפשר לבדוק כבר עכשיו",
      detailsTitle: "פירוט תזרים עו״ש",
      classifyLaterTitle: "דברים שכדאי לסווג בהמשך",
      auditTrailTitle: "איך הנתונים החלקיים השפיעו על הדוח",
    },
    recommendedSections: [
      "work_done",
      "bottom_line",
      "meaning",
      "check_first",
      "details_by_area",
      "classify_later",
      "export",
    ],
    primaryActions: [
      {
        title: "להעלות פירוטי אשראי לאותה תקופה",
        whyFirst: "חיוב כרטיס בעו״ש הוא סכום אחד, לא פירוט ההוצאות.",
        whatToDo: "העלו קבצי אשראי של אותם חודשים.",
        amountType: "no_amount",
      },
    ],
    allowedClaims: ["אפשר לזהות הכנסות ותנועות בנק", "פירוט ההוצאות חסר"],
    forbiddenClaims: ["פירוט מלא של הוצאות", "חיסכון לפי קטגוריות אשראי"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["large unclear income", "large recurring checks"],
      neverBlockFor: ["utilities", "known merchants"],
    },
    evidenceRules: ["Do not categorize hidden credit card spend."],
    claudeCopyHints: {
      tone: "transparent",
      doSay: ["הניתוח חלקי", "חסר פירוט אשראי"],
      doNotSay: ["זיהינו את כל ההוצאות"],
    },
  },

  // 3
  insufficient_data: {
    id: "insufficient_data",
    kind: "data_quality",
    priority: 998,
    label: "אין מספיק נתונים",
    healthTone: "neutral",
    trigger: {
      description:
        "Not enough data, no files, too few rows, or parse confidence low.",
      test: (f) =>
        f.reportType === "insufficient_data" || f.dataConfidence === "low",
    },
    userFear: "העליתי קובץ אבל המערכת לא מבינה מספיק.",
    mainAha: "אין מספיק נתונים כדי לתת אבחון אמין.",
    ui: {
      bottomLineHeadline: "אין מספיק נתונים לאבחון מלא",
      meaningTitle: "מה חסר כדי לדייק",
      meaningBody:
        "המערכת לא צריכה לנחש. כדי לתת דוח אמין צריך עוד קבצים או קבצים ברורים יותר.",
      checkFirstTitle: "מה להעלות עכשיו",
      controlTitle: "מה כן אפשר לבדוק",
      detailsTitle: "מה הצלחנו לקרוא",
      classifyLaterTitle: "דברים שלא סווגו",
      auditTrailTitle: "למה הדוח חלקי",
    },
    recommendedSections: [
      "work_done",
      "bottom_line",
      "meaning",
      "check_first",
      "export",
    ],
    primaryActions: [
      {
        title: "להעלות עו״ש ואשראי של 3 חודשים",
        whyFirst: "זה הבסיס לדוח אמין.",
        whatToDo: "העלו קבצי Excel מלאים ולא צילומי מסך.",
        amountType: "no_amount",
      },
    ],
    allowedClaims: ["חסר מידע", "לא ננחש"],
    forbiddenClaims: ["חוסר", "עודף", "פוטנציאל חיסכון"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["everything until enough data"],
    },
    evidenceRules: ["Do not create findings without readable rows."],
    claudeCopyHints: {
      tone: "helpful, not apologetic",
      doSay: ["כדי לדייק צריך עוד נתונים"],
      doNotSay: ["הדוח נכשל", "המצב לא ברור בגללכם"],
    },
  },

  // 4
  stable_healthy: {
    id: "stable_healthy",
    kind: "primary_diagnosis",
    priority: 100,
    label: "המצב תקין — יש מקום לשיפור",
    healthTone: "green",
    trigger: {
      description: "Stable income covers expenses and no major risk signals.",
      test: (f) =>
        f.reportType === "full" &&
        !f.hasMaterialVariableIncome &&
        f.fixedOnlyGap > 0 &&
        f.debtMonthlyPaymentTotal < f.fixedMonthlyIncome * 0.15,
    },
    userFear: "יש הכנסה, אבל אולי אנחנו מפספסים משהו.",
    mainAha: "המצב הבסיסי תקין. השיפור נמצא בסעיפים גמישים ובסדר.",
    ui: {
      bottomLineHeadline: "המצב הבסיסי תקין — יש מקום לשיפור",
      meaningTitle: "מה זה אומר בפועל",
      meaningBody:
        "ההכנסה הקבועה מכסה את ההוצאות שנצפו. עכשיו כדאי לבדוק סעיפים גמישים, מנויים והעברות שמטשטשות את התמונה.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה יש לכם שליטה",
      detailsTitle: "פירוט לפי תחומים",
      classifyLaterTitle: "דברים שכדאי לסווג בהמשך",
      auditTrailTitle: "איך הסיווגים השפיעו על הדוח",
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "לבדוק סעיפים גמישים לפני התחייבויות",
        whyFirst:
          "הבסיס נראה יציב, ולכן השיפור נמצא בדברים שיש לכם שליטה עליהם.",
        whatToDo: "עברו על Wolt, מסעדות, מנויים והעברות קטנות.",
        amountType: "review_amount",
        shouldShowAmountFrom: "none",
      },
    ],
    allowedClaims: ["המצב תקין", "יש מקום לשיפור"],
    forbiddenClaims: ["חוסר", "מסוכן", "דורש טיפול"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["small transactions", "utilities", "known merchants"],
    },
    evidenceRules: ["Show evidence for each review category."],
    claudeCopyHints: {
      tone: "encouraging and practical",
      doSay: ["יש בסיס טוב", "כדאי לבדוק איפה אפשר לייעל"],
      doNotSay: ["אתם מבזבזים", "צריך לקצץ"],
    },
  },

  // 5
  surplus_not_felt: {
    id: "surplus_not_felt",
    kind: "primary_diagnosis",
    priority: 200,
    label: "עודף מחושב שלא מורגש",
    healthTone: "yellow",
    trigger: {
      description: "Income exceeds expenses but user may not feel surplus.",
      test: (f) =>
        f.reportType === "full" &&
        !f.hasMaterialVariableIncome &&
        f.fixedOnlyGap > Math.max(1500, f.fixedMonthlyIncome * 0.05),
    },
    userFear: "על הנייר יש כסף, אבל בפועל לא מרגישים אותו.",
    mainAha: "יש עודף מחושב. עכשיו צריך להבין אם הוא באמת נשאר.",
    ui: {
      bottomLineHeadline: "יש עודף מחושב — עכשיו צריך להבין אם הוא באמת נשאר",
      meaningTitle: "מה זה אומר בפועל",
      meaningBody:
        "אם בפועל לא מרגישים עודף כזה, צריך לבדוק חיסכון, העברות, חשבונות נוספים, מזומן או הוצאות שלא הופיעו בקבצים.",
      checkFirstTitle: "לאן לבדוק שהעודף הולך",
      controlTitle: "איפה אפשר לשפר שליטה",
      detailsTitle: "פירוט שמסביר את העודף",
      classifyLaterTitle: "דברים שכדאי לסווג בהמשך",
      auditTrailTitle: "איך הסיווגים השפיעו על הדוח",
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "לבדוק לאן הולך העודף המחושב",
        whyFirst:
          "הדוח מצביע על עודף, אבל ייתכן שהוא עובר לחיסכון, חשבון אחר או הוצאה שלא הופיעה.",
        whatToDo: "בדקו העברות, חיסכון אוטומטי, מזומן וחשבונות נוספים.",
        amountType: "review_amount",
      },
    ],
    allowedClaims: ["עודף מחושב", "צריך להבין אם הוא נשאר"],
    forbiddenClaims: ["פער", "חוסר", "מינוס", "אדום"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["possible internal transfer", "missing account context"],
      neverBlockFor: ["known utilities", "small vendors"],
    },
    evidenceRules: ["Show surplus as positive and calm."],
    claudeCopyHints: {
      tone: "curious, not alarmist",
      doSay: ["עודף מחושב", "למה הוא לא מורגש"],
      doNotSay: ["פער", "בעיה חמורה"],
    },
  },

  // 6
  small_deficit: {
    id: "small_deficit",
    kind: "primary_diagnosis",
    priority: 250,
    label: "חוסר חודשי קטן",
    healthTone: "yellow",
    trigger: {
      description: "Expenses exceed fixed income by a small amount.",
      test: (f) =>
        f.reportType === "full" &&
        !f.hasMaterialVariableIncome &&
        f.fixedOnlyGap < 0 &&
        Math.abs(f.fixedOnlyGap) <= Math.max(2500, f.fixedMonthlyIncome * 0.1),
    },
    userFear: "אנחנו קצת במינוס ולא ברור למה.",
    mainAha:
      "יש חוסר חודשי קטן. כנראה שהוא מגיע מסעיפים גמישים או תנועות לא מסווגות.",
    ui: {
      bottomLineHeadline: "יש חוסר חודשי קטן — כדאי להבין מה יוצר אותו",
      meaningTitle: "מה זה אומר בפועל",
      meaningBody:
        "החוסר לא בהכרח דורש שינוי דרמטי. קודם מזהים את הסעיפים הגמישים והדברים שדורשים סיווג.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה יש לכם שליטה",
      detailsTitle: "פירוט לפי תחומים",
      classifyLaterTitle: "דברים שכדאי לסווג בהמשך",
      auditTrailTitle: "איך הסיווגים השפיעו על הדוח",
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "למצוא את הסעיף הגמיש שמסביר את החוסר",
        whyFirst:
          "חוסר קטן לרוב נפתר דרך שליטה בסעיף אחד או שניים, לא דרך קיצוץ כללי.",
        whatToDo: "בדקו Wolt, מסעדות, מנויים והעברות לא מסווגות.",
        amountType: "review_amount",
      },
    ],
    allowedClaims: ["חוסר חודשי קטן", "כדאי לבדוק"],
    forbiddenClaims: ["חמור", "מסוכן", "דורש טיפול מיידי"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["large recurring check", "possible missing income"],
      neverBlockFor: ["one-time small expenses"],
    },
    evidenceRules: ["Rank findings by impact, not by easy blame."],
    claudeCopyHints: {
      tone: "practical",
      doSay: ["כדאי לבדוק", "אפשר להתחיל מסעיף אחד"],
      doNotSay: ["אתם חייבים לקצץ"],
    },
  },

  // 7
  large_deficit: {
    id: "large_deficit",
    kind: "primary_diagnosis",
    priority: 300,
    label: "חוסר חודשי משמעותי",
    healthTone: "orange",
    trigger: {
      description: "Expenses exceed income materially.",
      test: (f) =>
        f.reportType === "full" &&
        !f.hasMaterialVariableIncome &&
        f.fixedOnlyGap < 0 &&
        Math.abs(f.fixedOnlyGap) > Math.max(2500, f.fixedMonthlyIncome * 0.1),
    },
    userFear: "יש חוסר גדול, אבל אני לא רוצה דוח מפחיד.",
    mainAha: "יש חוסר חודשי משמעותי. צריך להבין קודם מה יוצר אותו.",
    ui: {
      bottomLineHeadline: "יש חוסר חודשי משמעותי — צריך להבין מה יוצר אותו",
      meaningTitle: "מה זה אומר בפועל",
      meaningBody:
        "לפני שנוגעים בכל סעיף קטן, צריך להפריד בין התחייבויות, הוצאות קבועות וסעיפים גמישים גדולים.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה יש שליטה",
      detailsTitle: "פירוט מקורות החוסר",
      classifyLaterTitle: "דברים שכדאי לסווג בהמשך",
      auditTrailTitle: "איך הסיווגים השפיעו על הדוח",
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "להפריד התחייבויות מסעיפים גמישים",
        whyFirst:
          "לא כל הוצאה היא מקום לחיסכון. דיור, הלוואות וחשבונות הם בסיס; Wolt ומנויים הם שליטה.",
        whatToDo:
          "בדקו קודם fixed commitments, אחר כך Wolt/מסעדות ומנויים.",
        amountType: "review_amount",
      },
    ],
    allowedClaims: ["חוסר חודשי", "צריך להבין מה יוצר אותו"],
    forbiddenClaims: ["חמור", "מסוכן", "קחו הלוואה"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: [
        "missing income",
        "large unclear transaction",
        "large recurring payment",
      ],
      neverBlockFor: ["small vendor charge"],
    },
    evidenceRules: [
      "Never start with tiny subscriptions if housing/debt dominates.",
    ],
    claudeCopyHints: {
      tone: "direct but calm",
      doSay: ["צריך להבין מה יוצר אותו"],
      doNotSay: ["המצב חמור", "חייבים"],
    },
  },

  // 8
  variable_income_dependent: {
    id: "variable_income_dependent",
    kind: "primary_diagnosis",
    priority: 500,
    label: "התמונה תלויה בהכנסה משתנה",
    healthTone: "yellow",
    trigger: {
      description: "Material variable income changes the financial picture.",
      test: (f) =>
        f.reportType === "full" &&
        f.hasMaterialVariableIncome &&
        (
          f.variableIncomeMonthlyAvg > f.fixedMonthlyIncome * 0.1 ||
          Math.sign(f.fixedOnlyGap) !== Math.sign(f.withVariableGap) ||
          f.fixedOnlyGap < 0
        ),
    },
    userFear: "אי אפשר להבין את המצב כי ההכנסה לא קבועה.",
    mainAha: "ההכנסה המשתנה היא מה שמחזיק את התמונה.",
    ui: {
      bottomLineHeadline:
        "ההכנסה הקבועה לבד לא מכסה את רמת ההוצאות שנצפתה",
      meaningTitle: "מה זה אומר בפועל",
      meaningBody:
        "בחודשים שבהם ההכנסה המשתנה לא נכנסת, רמת ההוצאות לא מתכנסת. בחודשים שבהם היא נכנסת גבוה, אתם מתקרבים לאיזון.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה יש לכם שליטה",
      detailsTitle: "פירוט לפי תחומים",
      classifyLaterTitle: "דברים שכדאי לסווג בהמשך",
      auditTrailTitle: "איך הסיווגים השפיעו על הדוח",
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "להגדיר בסיס הכנסה חודשי שאפשר לסמוך עליו",
        whyFirst: "ההכנסה המשתנה משנה את כל התמונה.",
        whatToDo: "הגדירו מה הסכום המינימלי שצפוי להיכנס ברוב החודשים.",
        amountType: "no_amount",
      },
    ],
    allowedClaims: ["תלוי בהכנסה משתנה", "צריך שני תרחישים"],
    forbiddenClaims: ["מספר אחד מוחלט", "₪X/חודש להכנסה לא קבועה"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["partner/business income classification"],
      neverBlockFor: ["utilities", "medical one-time", "small vendors"],
    },
    evidenceRules: [
      "Show fixed-only scenario.",
      "Show with-variable scenario.",
      "Never combine variable income into fixed income.",
    ],
    claudeCopyHints: {
      tone: "clear and reassuring",
      doSay: ["ההכנסה המשתנה היא מה שמחזיק את התמונה", "שני תרחישים"],
      doNotSay: ["הכנסה קבועה", "פער אחד סופי"],
    },
  },

  // 9
  missing_income: {
    id: "missing_income",
    kind: "primary_diagnosis",
    priority: 480,
    label: "ייתכן שחסרה הכנסה בתמונה",
    healthTone: "yellow",
    trigger: {
      description:
        "Observed expenses suggest income source may be missing.",
      test: (f) =>
        f.reportType === "full" &&
        f.missingIncomeLikely &&
        f.fixedOnlyGap < 0,
    },
    userFear: "הדוח אומר חוסר אבל אולי חסר חשבון או מקור הכנסה.",
    mainAha: "ייתכן שהתמונה לא כוללת את כל ההכנסות.",
    ui: {
      bottomLineHeadline: "ייתכן שחסרה הכנסה בתמונה",
      meaningTitle: "מה זה אומר בפועל",
      meaningBody:
        "אם יש הכנסה נוספת, חשבון נוסף או העברות שלא הועלו, החישוב משתנה.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "מה אפשר לשפר אחרי השלמת התמונה",
      detailsTitle: "מה הדוח כן רואה",
      classifyLaterTitle: "דברים שכדאי לסווג בהמשך",
      auditTrailTitle: "איך הסיווגים השפיעו על הדוח",
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "לוודא שכל מקורות ההכנסה מופיעים",
        whyFirst:
          "בלי תמונת הכנסה מלאה אי אפשר להבין אם יש חוסר אמיתי.",
        whatToDo:
          "בדקו חשבון נוסף, הכנסה מבן/בת זוג, עסק, קצבאות או החזרים.",
        amountType: "no_amount",
      },
    ],
    allowedClaims: ["ייתכן שחסרה הכנסה", "צריך להשלים תמונה"],
    forbiddenClaims: ["חוסר ודאי", "קיצוץ מיידי"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["possible missing income"],
      neverBlockFor: ["small expenses"],
    },
    evidenceRules: ["Show what data exists and what may be missing."],
    claudeCopyHints: {
      tone: "investigative",
      doSay: ["ייתכן שחסרה הכנסה"],
      doNotSay: ["המספרים לא מסתדרים"],
    },
  },

  // 10
  one_time_income_distortion: {
    id: "one_time_income_distortion",
    kind: "primary_diagnosis",
    priority: 470,
    label: "הכנסה חד־פעמית מעוותת את התמונה",
    healthTone: "yellow",
    trigger: {
      description: "Large one-time income was detected/excluded.",
      test: (f) =>
        f.oneTimeIncomeExcludedTotal >
        Math.max(5000, f.fixedMonthlyIncome * 0.2),
    },
    userFear: "נכנס סכום גדול, אבל זה לא אומר שהחודש רגיל.",
    mainAha: "יש הכנסה חד־פעמית שאסור לחשב כהכנסה חודשית.",
    ui: {
      bottomLineHeadline: "יש הכנסה חד־פעמית שלא נספרה כהכנסה חודשית",
      meaningTitle: "מה זה אומר בפועל",
      meaningBody:
        "סכום חד־פעמי כמו קרן השתלמות יכול לכסות חובות או הוצאות, אבל הוא לא מייצג חודש רגיל.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה יש שליטה אחרי ההחרגה",
      detailsTitle: "פירוט הכנסות והחרגות",
      classifyLaterTitle: "דברים שכדאי לסווג בהמשך",
      auditTrailTitle: "איך הסיווגים השפיעו על הדוח",
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "להבין לאן הלך הסכום החד־פעמי",
        whyFirst:
          "אם הסכום כיסה חוב או הוצאה גדולה, הוא מסביר חלק מהתמונה אבל לא משנה את החודש הרגיל.",
        whatToDo:
          "בדקו האם שימש לחיסכון, כיסוי חוב, הוצאה גדולה או חשבון אחר.",
        amountType: "review_amount",
      },
    ],
    allowedClaims: ["חד־פעמי", "לא נספר כהכנסה חודשית"],
    forbiddenClaims: ["/חודש", "הכנסה קבועה"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["large one-time source unclear"],
      neverBlockFor: ["small refunds"],
    },
    evidenceRules: ["Never show one-time income as monthly."],
    claudeCopyHints: {
      tone: "clarifying",
      doSay: ["חד־פעמי", "לא נספר כהכנסה חודשית"],
      doNotSay: ["₪X/חודש"],
    },
  },

  // 11
  one_time_expense_distortion: {
    id: "one_time_expense_distortion",
    kind: "primary_diagnosis",
    priority: 430,
    label: "הוצאה חד־פעמית מעוותת את התמונה",
    healthTone: "yellow",
    trigger: {
      description: "Large one-time expense distorts monthly run-rate.",
      test: (f) =>
        f.oneTimeExpenseTotal > Math.max(3000, f.monthlyExpenses * 0.1),
    },
    userFear: "החודש נראה רע בגלל משהו חד־פעמי.",
    mainAha: "יש הוצאה חד־פעמית שצריך להפריד מההתנהגות החודשית.",
    ui: {
      bottomLineHeadline: "יש הוצאה חד־פעמית שמעוותת את התמונה",
      meaningTitle: "מה זה אומר בפועל",
      meaningBody:
        "לא נכון להסיק מהוצאה חד־פעמית על הרגל חודשי. צריך לראות את התמונה עם ובלי ההוצאה.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה אפשר לשפר בחודש רגיל",
      detailsTitle: "פירוט הוצאות חד־פעמיות",
      classifyLaterTitle: "דברים שכדאי לסווג בהמשך",
      auditTrailTitle: "איך הסיווגים השפיעו על הדוח",
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "להפריד חד־פעמי מהחודש הרגיל",
        whyFirst: "כך לא מקבלים החלטות על סמך חודש חריג.",
        whatToDo: "בדקו האם ההוצאה תחזור או הייתה אירוע חד־פעמי.",
        amountType: "review_amount",
      },
    ],
    allowedClaims: ["חד־פעמי", "לא בהכרח התנהגות חודשית"],
    forbiddenClaims: ["חיסכון קבוע", "קיצוץ קבוע"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["large one-time expense unclear and material"],
      neverBlockFor: ["one-time under threshold"],
    },
    evidenceRules: ["Show with/without one-time if material."],
    claudeCopyHints: {
      tone: "careful",
      doSay: ["לא להסיק מחודש חריג"],
      doNotSay: ["זה תמיד קורה"],
    },
  },

  // 12
  debt_pressure: {
    id: "debt_pressure",
    kind: "primary_diagnosis",
    priority: 420,
    label: "עומס חוב / הלוואה",
    healthTone: "orange",
    trigger: {
      description: "Material debt balance or monthly loan payments.",
      test: (f) =>
        f.debtMonthlyPaymentTotal >
          Math.max(1200, f.fixedMonthlyIncome * 0.08) ||
        f.debtBalanceTotal > Math.max(30000, f.fixedMonthlyIncome),
    },
    userFear: "הלוואה או חוב אוכלים את החודש.",
    mainAha: "יש התחייבות קבועה שצריך להכניס לבסיס החודשי.",
    ui: {
      bottomLineHeadline:
        "יש התחייבות חוב שמשפיעה על הבסיס החודשי",
      meaningTitle: "מה זה אומר בפועל",
      meaningBody:
        "הלוואה היא לא מקום לחיסכון מיידי. היא התחייבות שצריך להכניס לתמונה לפני שבודקים סעיפים גמישים.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה כן יש שליטה",
      detailsTitle: "פירוט הלוואות וחוב",
      classifyLaterTitle: "דברים שכדאי לסווג בהמשך",
      auditTrailTitle: "איך הסיווגים השפיעו על הדוח",
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "להבין את עומס ההחזר החודשי",
        whyFirst: "זה חלק מהבסיס הקבוע ולא סעיף גמיש.",
        whatToDo: "בדקו יתרה, החזר חודשי, ריבית ותאריך סיום.",
        amountType: "fixed_commitment",
        shouldShowAmountFrom: "debtMonthlyPaymentTotal",
      },
    ],
    allowedClaims: ["התחייבות קבועה", "החזר חודשי"],
    forbiddenClaims: ["חיסכון מההלוואה", "קחו הלוואה חדשה"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["unclear loan/debt payment"],
      neverBlockFor: ["known monthly loan with evidence"],
    },
    evidenceRules: ["Separate balance from monthly payment."],
    claudeCopyHints: {
      tone: "serious but calm",
      doSay: ["התחייבות קבועה"],
      doNotSay: ["קחו הלוואה", "מסוכן"],
    },
  },

  // 13
  overdraft_interest: {
    id: "overdraft_interest",
    kind: "risk_context",
    priority: 410,
    label: "ריבית / מינוס חוזר",
    healthTone: "orange",
    trigger: {
      description: "Recurring overdraft or interest charges.",
      test: (f) => f.overdraftInterestMonthly > 100,
    },
    userFear: "כסף הולך לריבית ולא ברור כמה.",
    mainAha: "יש כסף שיוצא על ריבית או מינוס, לא על צריכה.",
    ui: {
      bottomLineHeadline: "יש ריבית חודשית שכדאי להבין",
      meaningTitle: "מה זה אומר בפועל",
      meaningBody:
        "ריבית על מינוס היא כסף שלא קונה שום דבר. צריך להבין אם היא חוזרת ומה גורם לה.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה אפשר להפחית עלות",
      detailsTitle: "פירוט ריביות ומינוס",
      classifyLaterTitle: "דברים שכדאי לסווג בהמשך",
      auditTrailTitle: "איך הסיווגים השפיעו על הדוח",
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "לבדוק מה גורם לריבית החודשית",
        whyFirst: "זה כסף שיוצא ללא ערך צרכני.",
        whatToDo:
          "בדקו מתי המינוס נוצר והאם הוא קשור לפער שוטף.",
        amountType: "review_amount",
      },
    ],
    allowedClaims: ["ריבית", "עלות חודשית"],
    forbiddenClaims: ["קחו הלוואה", "מסוכן"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["known interest charge"],
    },
    evidenceRules: ["Show interest as cost, not moral failure."],
    claudeCopyHints: {
      tone: "practical",
      doSay: ["כסף שיוצא על ריבית"],
      doNotSay: ["התנהלות גרועה"],
    },
  },

  // 14
  recurring_large_check: {
    id: "recurring_large_check",
    kind: "secondary_finding",
    priority: 390,
    label: "שיק גדול שחוזר",
    healthTone: "yellow",
    trigger: {
      description: "Large recurring check/payment exists.",
      test: (f) => f.recurringLargeChecksTotal > 1000,
    },
    userFear: "שיקים לא ברורים מנפחים את התמונה.",
    mainAha:
      "שיק חוזר גדול חייב סיווג כי הוא משנה את ההוצאות הקבועות.",
    ui: {
      bottomLineHeadline: "מצאנו שיק חוזר גדול שמשפיע על הבסיס",
      meaningTitle: "למה זה משנה",
      meaningBody:
        "אם זה דיור או חוב, זו התחייבות קבועה. אם זו העברה פנימית, לא נספור אותה כהוצאה.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "מה אפשר לשפר אחרי הסיווג",
      detailsTitle: "פירוט שיקים ותשלומים חוזרים",
      classifyLaterTitle: "שיקים קטנים לסיווג בהמשך",
      auditTrailTitle: "איך הסיווג השפיע על הדוח",
    },
    recommendedSections: ["details_by_area", "audit_trail"],
    primaryActions: [
      {
        title: "לסווג את השיק החוזר",
        whyFirst:
          "הוא יכול להיות הוצאה קבועה או העברה שלא צריך לספור.",
        whatToDo:
          "בחרו אם מדובר בדיור, חוב, ילדים, העברה פנימית או תשלום אחר.",
        amountType: "review_amount",
      },
    ],
    allowedClaims: ["משפיע על בסיס ההוצאות"],
    forbiddenClaims: ["חיסכון", "בזבוז"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["large recurring check"],
      neverBlockFor: ["one-time small check"],
    },
    evidenceRules: ["Show months seen and raw check descriptions."],
    claudeCopyHints: {
      tone: "clarifying",
      doSay: ["צריך לסווג כדי לא להטעות"],
      doNotSay: ["בעיה"],
    },
  },

  // 15
  internal_transfer_risk: {
    id: "internal_transfer_risk",
    kind: "secondary_finding",
    priority: 380,
    label: "סיכון לספירה כפולה / העברה פנימית",
    healthTone: "yellow",
    trigger: {
      description: "Large possible internal transfer exists.",
      test: (f) => f.internalTransferRiskTotal > 2000,
    },
    userFear: "הדוח סופר כסף שעבר בין חשבונות כאילו הוא הוצאה.",
    mainAha:
      "ייתכן שחלק מהתנועות הן העברות פנימיות ולא הוצאה אמיתית.",
    ui: {
      bottomLineHeadline:
        "ייתכן שיש העברה פנימית שמשנה את החישוב",
      meaningTitle: "למה זה משנה",
      meaningBody:
        "כסף שעבר בין חשבונות לא צריך להיספר כהכנסה או הוצאה חדשה.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "מה אפשר לשפר אחרי הסיווג",
      detailsTitle: "פירוט העברות פנימיות",
      classifyLaterTitle: "העברות שכדאי לסווג בהמשך",
      auditTrailTitle: "איך ההחרגות השפיעו על הדוח",
    },
    recommendedSections: ["details_by_area", "audit_trail"],
    primaryActions: [
      {
        title: "לבדוק אם זו העברה פנימית",
        whyFirst:
          "סיווג שגוי יכול להפוך עודף לחוסר או להפך.",
        whatToDo: "בדקו אם הכסף עבר בין חשבונות שלכם.",
        amountType: "review_amount",
      },
    ],
    allowedClaims: ["יכול לשנות את החישוב"],
    forbiddenClaims: ["זו בוודאות הוצאה", "זו בוודאות הכנסה"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["material possible internal transfer"],
      neverBlockFor: ["small payment apps unless material"],
    },
    evidenceRules: ["Show direction and source account if available."],
    claudeCopyHints: {
      tone: "careful",
      doSay: ["ייתכן", "צריך לסווג"],
      doNotSay: ["בטוח"],
    },
  },

  // 16
  housing_heavy: {
    id: "housing_heavy",
    kind: "risk_context",
    priority: 360,
    label: "דיור גבוה ביחס להכנסה",
    healthTone: "yellow",
    trigger: {
      description: "Housing cost is material.",
      test: (f) =>
        f.housingMonthly > Math.max(5000, f.fixedMonthlyIncome * 0.3),
    },
    userFear: "הדיור אוכל את רוב ההכנסה.",
    mainAha:
      "דיור הוא הוצאה קבועה גדולה, לא סעיף חיסכון מיידי.",
    ui: {
      bottomLineHeadline:
        "הדיור הוא חלק משמעותי מהבסיס החודשי",
      meaningTitle: "מה זה אומר בפועל",
      meaningBody:
        "לא מתייחסים לדיור כמו Wolt או מנויים. זו התחייבות בסיסית שמגדירה כמה נשאר לשליטה.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה כן יש שליטה",
      detailsTitle: "פירוט הוצאות דיור",
      classifyLaterTitle: "תשלומי דיור לסיווג בהמשך",
      auditTrailTitle: "איך סיווג הדיור השפיע על הדוח",
    },
    recommendedSections: ["bottom_line", "meaning", "details_by_area"],
    primaryActions: [
      {
        title: "להכניס דיור לבסיס הקבוע",
        whyFirst: "זה לא סעיף שמציגים כחיסכון מהיר.",
        whatToDo:
          "בדקו כמה נשאר אחרי דיור והתחייבויות קבועות.",
        amountType: "fixed_commitment",
        shouldShowAmountFrom: "housingMonthly",
      },
    ],
    allowedClaims: ["הוצאה קבועה", "חלק מהבסיס"],
    forbiddenClaims: ["מקום לחיסכון קל"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["unclear recurring housing-sized payment"],
      neverBlockFor: ["known rent/mortgage"],
    },
    evidenceRules: ["Do not call housing a savings opportunity."],
    claudeCopyHints: {
      tone: "grounded",
      doSay: ["הוצאה קבועה"],
      doNotSay: ["בטלו", "חיסכון קל"],
    },
  },

  // 17
  fixed_commitments_high: {
    id: "fixed_commitments_high",
    kind: "risk_context",
    priority: 350,
    label: "התחייבויות קבועות גבוהות",
    healthTone: "yellow",
    trigger: {
      description: "Fixed commitments are high relative to income.",
      test: (f) =>
        f.fixedCommitmentsMonthly > f.fixedMonthlyIncome * 0.55,
    },
    userFear: "אין מספיק גמישות כי יותר מדי קבוע.",
    mainAha: "חלק גדול מההכנסה כבר נעול בהתחייבויות.",
    ui: {
      bottomLineHeadline:
        "חלק גדול מההכנסה נעול בהתחייבויות קבועות",
      meaningTitle: "מה זה אומר בפועל",
      meaningBody:
        "כשיותר מדי הוצאות הן קבועות, השיפור מגיע מניהול בסיס ההכנסה והסעיפים הגמישים שנותרו.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה נשארה שליטה",
      detailsTitle: "פירוט התחייבויות קבועות",
      classifyLaterTitle: "תשלומים קבועים לסיווג בהמשך",
      auditTrailTitle:
        "איך הסיווגים השפיעו על הבסיס הקבוע",
    },
    recommendedSections: [
      "bottom_line",
      "meaning",
      "check_first",
      "details_by_area",
    ],
    primaryActions: [
      {
        title: "למפות את כל ההתחייבויות הקבועות",
        whyFirst: "זה מראה כמה כסף נשאר לשליטה אמיתית.",
        whatToDo:
          "הפרידו דיור, הלוואות, חשבונות וילדים מסעיפים גמישים.",
        amountType: "fixed_commitment",
      },
    ],
    allowedClaims: ["קבוע", "נעול", "לא מקום לחיסכון מהיר"],
    forbiddenClaims: ["בטלו", "קיצוץ קל"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["unclear recurring fixed payment"],
      neverBlockFor: ["known utility"],
    },
    evidenceRules: ["Separate fixed commitments from flexible spending."],
    claudeCopyHints: {
      tone: "structured",
      doSay: ["התחייבויות קבועות"],
      doNotSay: ["בזבוז"],
    },
  },

  // 18
  food_delivery_restaurants_high: {
    id: "food_delivery_restaurants_high",
    kind: "secondary_finding",
    priority: 300,
    label: "Wolt / מסעדות גבוהים",
    healthTone: "yellow",
    trigger: {
      description: "Food delivery/restaurants are material flexible spend.",
      test: (f) =>
        f.woltMonthly + f.restaurantsMonthly >
        Math.max(1200, f.monthlyExpenses * 0.06),
    },
    userFear: "אוכל בחוץ מצטבר בלי שמרגישים.",
    mainAha: "זה סעיף גמיש גדול שאפשר להחליט עליו במודע.",
    ui: {
      bottomLineHeadline:
        "Wolt ומסעדות הם סעיף גמיש משמעותי",
      meaningTitle: "למה זה משנה",
      meaningBody:
        "זה לא אומר לבטל אוכל בחוץ. זה אומר שהסכום מספיק גדול כדי להגדיר לו תקרה.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה יש שליטה",
      detailsTitle: "פירוט Wolt ומסעדות",
      classifyLaterTitle: "עסקאות אוכל לסיווג בהמשך",
      auditTrailTitle: "איך קטגוריית האוכל חושבה",
    },
    recommendedSections: ["control_opportunities", "details_by_area"],
    primaryActions: [
      {
        title: "להגדיר תקרה ל־Wolt ומסעדות",
        whyFirst: "זה סעיף גמיש, לא התחייבות.",
        whatToDo:
          "בדקו אם צמצום של 20%-30% אפשרי בלי לבטל לגמרי.",
        amountType: "review_amount",
        shouldShowAmountFrom: "woltMonthly",
      },
    ],
    allowedClaims: ["סעיף גמיש", "אפשר להגדיר תקרה"],
    forbiddenClaims: ["בזבוז", "תפסיקו להזמין"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["wolt", "restaurants"],
    },
    evidenceRules: [
      "Show transaction count and monthly average if available.",
    ],
    claudeCopyHints: {
      tone: "non-judgmental",
      doSay: ["להחליט במודע", "להגדיר תקרה"],
      doNotSay: ["בזבוזים"],
    },
  },

  // 19
  subscriptions_creep: {
    id: "subscriptions_creep",
    kind: "secondary_finding",
    priority: 280,
    label: "מנויים לבדיקה",
    healthTone: "yellow",
    trigger: {
      description: "Subscriptions are material.",
      test: (f) => f.subscriptionsMonthly > 500,
    },
    userFear: "יש הרבה מנויים אבל לא ברור מה באמת בשימוש.",
    mainAha: "מנויים הם סכום לבדיקה, לא חיסכון מובטח.",
    ui: {
      bottomLineHeadline:
        "מצאנו מנויים וכלים דיגיטליים לבדיקה",
      meaningTitle: "למה זה משנה",
      meaningBody:
        "לא כולם מיותרים. הפוטנציאל תלוי במה שבאמת בשימוש ובחפיפות.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה אפשר לשפר",
      detailsTitle: "פירוט מנויים",
      classifyLaterTitle: "מנויים לסיווג בהמשך",
      auditTrailTitle: "איך מנויים חושבו",
    },
    recommendedSections: ["control_opportunities", "details_by_area"],
    primaryActions: [
      {
        title: "לעבור על מנויים וכלים דיגיטליים",
        whyFirst: "זה סעיף מפוזר שקשה לראות ידנית.",
        whatToDo:
          "סמנו מה בשימוש ומה חופף. אל תבטלו לפי סכום בלבד.",
        amountType: "review_amount",
        shouldShowAmountFrom: "subscriptionsMonthly",
      },
    ],
    allowedClaims: ["מנויים לבדיקה", "פוטנציאל תלוי בשימוש"],
    forbiddenClaims: [
      "חיסכון מובטח",
      "פוטנציאל חיסכון עד כל הסכום",
    ],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["subscriptions"],
    },
    evidenceRules: [
      "Show supplier breakdown only if evidence exists.",
      "Never show ₪0 evidence rows.",
      "confirmed_savings only if duplicate/unused evidence exists.",
    ],
    claudeCopyHints: {
      tone: "careful",
      doSay: ["לבדיקה", "תלוי במה שבשימוש"],
      doNotSay: ["בטלו הכל", "חיסכון מובטח"],
    },
  },

  // 20
  payment_apps_blind_spot: {
    id: "payment_apps_blind_spot",
    kind: "secondary_finding",
    priority: 260,
    label: "BIT / PayBox אזור עיוור",
    healthTone: "yellow",
    trigger: {
      description: "Payment app volume is material.",
      test: (f) => f.paymentAppsMonthly > 750,
    },
    userFear: "ביט ופייבוקס נבלעים וקשה לדעת מה הם.",
    mainAha: "BIT ו־PayBox הם אזור עיוור עד שמסווגים אותם.",
    ui: {
      bottomLineHeadline: "BIT ו־PayBox הם אזור עיוור",
      meaningTitle: "למה זה משנה",
      meaningBody:
        "חלק יכול להיות החזרים, קניות משותפות או הוצאות אמיתיות. לא מציגים את זה כחיסכון לפני סיווג.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה יש שליטה אחרי סיווג",
      detailsTitle: "פירוט BIT / PayBox",
      classifyLaterTitle: "העברות לסיווג בהמשך",
      auditTrailTitle: "איך תשלומי אפליקציה טופלו",
    },
    recommendedSections: ["details_by_area", "classify_later"],
    primaryActions: [
      {
        title: "לסווג את תנועות BIT / PayBox הגדולות",
        whyFirst: "זה אזור עיוור, לא בהכרח חיסכון.",
        whatToDo: "סווגו את 10-15 התנועות הגדולות.",
        amountType: "review_amount",
        shouldShowAmountFrom: "paymentAppsMonthly",
      },
    ],
    allowedClaims: ["אזור עיוור", "דורש סיווג"],
    forbiddenClaims: ["חיסכון", "בזבוז"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["payment apps before report"],
    },
    evidenceRules: [
      "Group payment apps; do not block the report.",
    ],
    claudeCopyHints: {
      tone: "curious",
      doSay: ["אזור עיוור", "צריך לסווג"],
      doNotSay: ["חיסכון"],
    },
  },

  // 21
  municipal_education_review: {
    id: "municipal_education_review",
    kind: "secondary_finding",
    priority: 240,
    label: "עירייה / חינוך לבדיקה",
    healthTone: "yellow",
    trigger: {
      description: "Municipal or education payments are material.",
      test: (f) => f.municipalMonthly > 500,
    },
    userFear: "עירייה, מים, חינוך וחוגים מתערבבים.",
    mainAha: "תשלומים עירוניים צריכים פיצול, לא פאניקה.",
    ui: {
      bottomLineHeadline:
        "תשלומים עירוניים וחינוך דורשים פיצול",
      meaningTitle: "למה זה משנה",
      meaningBody:
        "עירייה יכולה לכלול ארנונה, מים, חינוך, חוגים או אגרות. לא מציגים את זה כחיסכון בלי סיווג.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה אפשר לדייק",
      detailsTitle: "פירוט עירייה / חינוך",
      classifyLaterTitle: "חיובים עירוניים לסיווג בהמשך",
      auditTrailTitle: "איך תשלומים עירוניים טופלו",
    },
    recommendedSections: ["details_by_area", "classify_later"],
    primaryActions: [
      {
        title: "לפצל תשלומים עירוניים לפי סוג",
        whyFirst:
          "אותו ספק יכול לכלול כמה סוגי הוצאות שונים.",
        whatToDo:
          "הפרידו ארנונה, מים, חינוך, חוגים ואגרות.",
        amountType: "review_amount",
        shouldShowAmountFrom: "municipalMonthly",
      },
    ],
    allowedClaims: ["דורש פיצול", "לא בהכרח חיסכון"],
    forbiddenClaims: ["כפילות ודאית", "חיסכון ודאי"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["municipal charges before report"],
    },
    evidenceRules: ["Never make municipal automatically blocking."],
    claudeCopyHints: {
      tone: "organized",
      doSay: ["לפצל לפי סוג"],
      doNotSay: ["כפילות"],
    },
  },

  // 22
  medical_health_one_time: {
    id: "medical_health_one_time",
    kind: "secondary_finding",
    priority: 220,
    label: "הוצאות רפואיות חד־פעמיות",
    healthTone: "neutral",
    trigger: {
      description: "One-time medical/health charges exist.",
      test: (f) => f.medicalOneTimeTotal > 500,
    },
    userFear: "הוצאה רפואית חד־פעמית נראית כמו דפוס.",
    mainAha:
      "הוצאה רפואית חד־פעמית לא צריכה לעצור את הדוח.",
    ui: {
      bottomLineHeadline: "זוהו הוצאות רפואיות חד־פעמיות",
      meaningTitle: "למה זה משנה",
      meaningBody:
        "לא כל הוצאה רפואית היא דפוס חודשי. אם היא לא חוזרת, היא נשארת לסיווג בהמשך.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "מה אפשר לדייק",
      detailsTitle: "פירוט בריאות ורפואה",
      classifyLaterTitle: "הוצאות רפואיות לסיווג בהמשך",
      auditTrailTitle: "איך הוצאות רפואיות טופלו",
    },
    recommendedSections: ["classify_later", "details_by_area"],
    primaryActions: [
      {
        title:
          "להשאיר הוצאות רפואיות חד־פעמיות לסיווג בהמשך",
        whyFirst: "הן לא צריכות לעכב את הדוח הראשי.",
        whatToDo: "בדקו רק אם הן חוזרות או מוחזרות.",
        amountType: "review_amount",
      },
    ],
    allowedClaims: ["חד־פעמי", "לסיווג בהמשך"],
    forbiddenClaims: ["חיסכון", "בעיה"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: [
        "MaccabiDent under 2000 once",
        "pharmacy once",
      ],
    },
    evidenceRules: [
      "Place one-time medical charges in non_blocking_items.",
    ],
    claudeCopyHints: {
      tone: "calm",
      doSay: ["לא עצרנו בשביל זה את הדוח"],
      doNotSay: ["בעיה"],
    },
  },

  // 23
  business_reimbursable_expenses: {
    id: "business_reimbursable_expenses",
    kind: "secondary_finding",
    priority: 210,
    label: "הוצאות עסקיות / מוחזרות אפשריות",
    healthTone: "yellow",
    trigger: {
      description:
        "Possible business or reimbursable expenses detected.",
      test: (f) => f.businessOrReimbursablePossibleTotal > 1000,
    },
    userFear:
      "הדוח סופר הוצאה פרטית למרות שהיא עסקית או מוחזרת.",
    mainAha:
      "ייתכן שחלק מההוצאות לא באמת הוצאה משפחתית נטו.",
    ui: {
      bottomLineHeadline:
        "ייתכן שחלק מההוצאות עסקיות או מוחזרות",
      meaningTitle: "למה זה משנה",
      meaningBody:
        "אם הוצאה מוחזרת או עסקית, לא נכון להציג אותה כהוצאה משפחתית רגילה.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "מה אפשר לדייק",
      detailsTitle: "פירוט הוצאות עסקיות / מוחזרות",
      classifyLaterTitle: "הוצאות לסיווג בהמשך",
      auditTrailTitle:
        "איך הוצאות מוחזרות השפיעו על הדוח",
    },
    recommendedSections: ["details_by_area", "classify_later"],
    primaryActions: [
      {
        title: "לבדוק אילו הוצאות מוחזרות או עסקיות",
        whyFirst:
          "זה יכול לשנות את ההוצאות המשפחתיות האמיתיות.",
        whatToDo:
          "סמנו הוצאות שמוחזרות מהמעסיק או שייכות לעסק.",
        amountType: "review_amount",
      },
    ],
    allowedClaims: ["ייתכן שמוחזר", "דורש סיווג"],
    forbiddenClaims: ["חיסכון", "בטוח עסקי"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: [
        "large reimbursable item that changes monthly result",
      ],
      neverBlockFor: ["small vendor charges"],
    },
    evidenceRules: [
      "Do not exclude unless user confirmed or strong evidence exists.",
    ],
    claudeCopyHints: {
      tone: "careful",
      doSay: ["ייתכן", "דורש סיווג"],
      doNotSay: ["בטוח"],
    },
  },

  // 24
  seasonal_family_expenses: {
    id: "seasonal_family_expenses",
    kind: "secondary_finding",
    priority: 200,
    label: "הוצאות משפחתיות עונתיות",
    healthTone: "yellow",
    trigger: {
      description: "Seasonal family expenses are material.",
      test: (f) => f.seasonalFamilyExpensesTotal > 1500,
    },
    userFear:
      "חודש חגים/קייטנות/חזרה ללימודים נראה כמו חודש רגיל.",
    mainAha:
      "יש הוצאות עונתיות שלא נכון להפוך להרגל חודשי.",
    ui: {
      bottomLineHeadline:
        "יש הוצאות משפחתיות עונתיות שמשנות את התמונה",
      meaningTitle: "למה זה משנה",
      meaningBody:
        "חגים, קייטנות, חזרה ללימודים או אירועים משפחתיים יכולים לעוות את החודש.",
      checkFirstTitle: "מה לבדוק קודם",
      controlTitle: "איפה אפשר להתכונן",
      detailsTitle: "פירוט הוצאות משפחתיות עונתיות",
      classifyLaterTitle: "הוצאות עונתיות לסיווג בהמשך",
      auditTrailTitle: "איך עונתיות השפיעה על הדוח",
    },
    recommendedSections: ["details_by_area", "classify_later"],
    primaryActions: [
      {
        title: "להפריד עונתי מהשוטף",
        whyFirst:
          "כך לא מקבלים החלטות על סמך חודש חריג.",
        whatToDo:
          "סמנו חגים, קייטנות, חזרה ללימודים ואירועים חד־פעמיים.",
        amountType: "review_amount",
      },
    ],
    allowedClaims: ["עונתי", "לא בהכרח חודשי"],
    forbiddenClaims: ["דפוס קבוע", "חיסכון בטוח"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: [
        "seasonal family expense before report unless huge and unclear",
      ],
    },
    evidenceRules: [
      "Show as seasonal/review, not fixed monthly behavior.",
    ],
    claudeCopyHints: {
      tone: "contextual",
      doSay: ["עונתי", "לא חודש רגיל"],
      doNotSay: ["תמיד"],
    },
  },
};

/**
 * Pick one primary diagnosis and multiple secondary findings.
 *
 * Primary diagnosis decides the bottom-line story.
 * Secondary findings populate:
 *   - מה לבדוק קודם
 *   - איפה אפשר לשפר
 *   - פירוט לפי תחומים
 */
export function selectPlaybooks(facts: FactsForPlaybooks): {
  primary: Playbook;
  secondary: Playbook[];
} {
  const all = Object.values(PLAYBOOKS)
    .filter((p) => p.trigger.test(facts))
    .sort((a, b) => b.priority - a.priority);

  const primary =
    all.find((p) => p.kind === "data_quality") ||
    all.find((p) => p.kind === "primary_diagnosis") ||
    PLAYBOOKS.stable_healthy;

  const secondary = all
    .filter((p) => p.id !== primary.id)
    .filter(
      (p) =>
        p.kind === "secondary_finding" || p.kind === "risk_context",
    )
    .slice(0, 5);

  return { primary, secondary };
}

/**
 * Build report UI structure from selected playbooks.
 * Controls section titles and order.
 */
export function buildReportUIStructure(
  primary: Playbook,
  _secondary: Playbook[],
  facts: FactsForPlaybooks,
): {
  sectionOrder: ReportSectionId[];
  titles: Record<ReportSectionId, string>;
  subtitles: Partial<Record<ReportSectionId, string>>;
} {
  const isPartial =
    primary.id === "partial_credit_only" ||
    primary.id === "partial_bank_only" ||
    primary.id === "insufficient_data";

  const sectionOrder = isPartial
    ? primary.recommendedSections
    : FINAL_REPORT_SECTION_ORDER;

  return {
    sectionOrder,
    titles: {
      work_done: "עברנו על הדוחות בשבילכם",
      bottom_line: "השורה התחתונה שלכם",
      meaning: primary.ui.meaningTitle,
      scenario_comparison: "שני תרחישים",
      check_first: "מה לבדוק קודם",
      control_opportunities: "איפה יש לכם שליטה",
      details_by_area: "פירוט לפי תחומים",
      classify_later: "דברים שכדאי לסווג בהמשך",
      audit_trail: "איך הסיווגים השפיעו על הדוח",
      export: "רוצים לעקוב אחרי זה?",
    },
    subtitles: {
      work_done:
        "במקום שתעברו ידנית על מאות תנועות, סידרנו את הנתונים לפי מה שבאמת משנה.",
      bottom_line: primary.ui.bottomLineHeadline,
      meaning: primary.ui.meaningBody,
      scenario_comparison: facts.hasMaterialVariableIncome
        ? "כשיש הכנסה משתנה, לא מציגים מספר אחד שמטעה."
        : "",
      check_first:
        "לא רשימת קיצוצים. סדר פעולות לפי מה שמשפיע על התמונה.",
      control_opportunities:
        "רק סעיפים שיש לכם שליטה עליהם. לא התחייבויות קבועות.",
      details_by_area:
        "למי שרוצה להבין את המספרים והראיות מאחורי האבחון.",
      classify_later:
        "לא עצרנו בשבילם את הדוח, אבל הם יעזרו לדייק את החודש הבא.",
      audit_trail:
        "למי שרוצה לראות איך התשובות והסיווגים השפיעו על החישוב.",
      export: "ייצוא הדוח, הסיווגים והדברים לבדיקה.",
    },
  };
}
