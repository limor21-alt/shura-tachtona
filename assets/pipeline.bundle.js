// supabase/functions/super-service/classify/merchants.ts
var SALARY_KEYWORDS = [
  "\u05DE\u05E9\u05DB\u05D5\u05E8\u05EA",
  "\u05E9\u05DB\u05E8",
  "salary",
  "payroll",
  "\u05D9\u05E9\u05E8 \u05DE\u05E9\u05DB\u05D5\u05E8\u05EA",
  "\u05EA\u05E9\u05DC\u05D5\u05DD \u05E9\u05DB\u05E8"
];
var KNOWN_EMPLOYERS = [
  // Tech
  "\u05D0\u05DE\u05D3\u05D5\u05E7\u05E1",
  "Amdocs",
  "Intel",
  "\u05D0\u05D9\u05E0\u05D8\u05DC",
  "Microsoft",
  "\u05DE\u05D9\u05E7\u05E8\u05D5\u05E1\u05D5\u05E4\u05D8",
  "Google",
  "\u05D2\u05D5\u05D2\u05DC",
  "Meta",
  "\u05DE\u05D8\u05D0",
  "\u05E4\u05D9\u05D9\u05E1\u05D1\u05D5\u05E7",
  "Facebook",
  "Apple",
  "\u05D0\u05E4\u05DC",
  "Wix",
  "\u05D5\u05D5\u05D9\u05E7\u05E1",
  "Monday",
  "\u05DE\u05D0\u05E0\u05D3\u05D9\u05D9",
  "\u05DE\u05E0\u05D3\u05D9\u05D9",
  "Elbit",
  "\u05D0\u05DC\u05D1\u05D9\u05D8",
  "Check Point",
  "\u05E6\u05F3\u05E7 \u05E4\u05D5\u05D9\u05E0\u05D8",
  "\u05E6'\u05E7 \u05E4\u05D5\u05D9\u05E0\u05D8",
  "checkpoint",
  "Matrix",
  "\u05DE\u05D8\u05E8\u05D9\u05E7\u05E1",
  "NICE",
  "\u05E0\u05D9\u05D9\u05E1",
  "Mellanox",
  "\u05DE\u05DC\u05D0\u05E0\u05D5\u05E7\u05E1",
  "IBM",
  "Oracle",
  "\u05D0\u05D5\u05E8\u05E7\u05DC",
  "SAP",
  // Finance / banks / insurance
  "\u05D1\u05E0\u05E7 \u05D4\u05E4\u05D5\u05E2\u05DC\u05D9\u05DD",
  "Bank Hapoalim",
  "\u05D1\u05E0\u05E7 \u05DC\u05D0\u05D5\u05DE\u05D9",
  "Bank Leumi",
  "\u05DE\u05D2\u05D3\u05DC",
  // appears here as employer too — disambiguated by amount/pattern
  "\u05D4\u05E8\u05D0\u05DC",
  "\u05DB\u05DC\u05DC",
  "\u05DE\u05E0\u05D5\u05E8\u05D4",
  // Healthcare / public
  "\u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05D1\u05E8\u05D9\u05D0\u05D5\u05EA \u05DB\u05DC\u05DC\u05D9\u05EA",
  "\u05DE\u05DB\u05D1\u05D9 \u05E9\u05D9\u05E8\u05D5\u05EA\u05D9 \u05D1\u05E8\u05D9\u05D0\u05D5\u05EA",
  "\u05DE\u05E9\u05E8\u05D3 \u05D4\u05D7\u05D9\u05E0\u05D5\u05DA",
  "\u05DE\u05E9\u05E8\u05D3 \u05D4\u05D1\u05E8\u05D9\u05D0\u05D5\u05EA",
  "\u05E6\u05D4\u05F4\u05DC",
  "\u05E6\u05D1\u05D0 \u05D4\u05D2\u05E0\u05D4 \u05DC\u05D9\u05E9\u05E8\u05D0\u05DC"
];
var CC_INTERNAL_CHARGE_PHRASES = [
  "\u05DE\u05E7\u05E1 \u05D7\u05D9\u05D5\u05D1",
  "\u05DE\u05E7\u05E1 \u05D0\u05D9\u05D8 \u05E4\u05D9",
  "MAX",
  "\u05D9\u05E9\u05E8\u05D0\u05DB\u05E8\u05D8 \u05D7\u05D9\u05D5\u05D1",
  "\u05D9\u05E9\u05E8\u05D0\u05DB\u05E8\u05D8",
  "\u05DB\u05D0\u05DC \u05D7\u05D9\u05D5\u05D1",
  "\u05DB\u05D0\u05DC",
  "\u05D5\u05D9\u05D6\u05D4 \u05D7\u05D9\u05D5\u05D1",
  "\u05D5\u05D9\u05D6\u05D4 \u05DB.\u05D0.\u05DC",
  "\u05D5\u05D9\u05D6\u05D4",
  "Visa",
  "Isracard",
  "Cal",
  "\u05DB\u05E8\u05D8\u05D9\u05E1\u05D9 \u05D0\u05E9\u05E8\u05D0\u05D9",
  "American Express \u05D7\u05D9\u05D5\u05D1"
];
var UTILITY_KEYWORDS = [
  "\u05D7\u05D1\u05E8\u05EA \u05D7\u05E9\u05DE\u05DC",
  "\u05D7\u05E9\u05DE\u05DC",
  "\u05DE\u05D9\u05DD",
  "\u05DE\u05D9 \u05EA\u05E7\u05D5\u05D5\u05D4",
  "\u05DE\u05D9 \u05D4\u05E8\u05E6\u05DC",
  "\u05D7\u05D1\u05E8\u05EA \u05DE\u05D9\u05DD",
  "\u05EA\u05D0\u05D2\u05D9\u05D3 \u05DE\u05D9\u05DD",
  "\u05D2\u05D6",
  "\u05E1\u05D5\u05E4\u05E8\u05D2\u05D6",
  "\u05E4\u05D6\u05D2\u05D6",
  "\u05D0\u05DE\u05D9\u05E9\u05E8\u05D0\u05D2\u05D6",
  "\u05D1\u05D6\u05E7",
  "Bezeq",
  "\u05D4\u05D5\u05D8",
  "Hot",
  "yes",
  "YES",
  "\u05E4\u05E8\u05D8\u05E0\u05E8",
  "Partner",
  "\u05E1\u05DC\u05E7\u05D5\u05DD",
  "Cellcom",
  "\u05E4\u05DC\u05D0\u05E4\u05D5\u05DF",
  "Pelephone",
  "012",
  "013",
  "014",
  "015",
  "016",
  "017",
  "018",
  "019",
  "\u05D0\u05E8\u05E0\u05D5\u05E0\u05D4",
  "\u05D5\u05E2\u05D3 \u05D1\u05D9\u05EA",
  "\u05D8\u05E8\u05D9\u05E4\u05DC\u05E4\u05DC\u05D9\u05D9"
];
var MEDICAL_KEYWORDS = [
  "\u05DE\u05DB\u05D1\u05D9\u05D3\u05E0\u05D8",
  "Maccabident",
  "MaccabiDent",
  "\u05DE\u05DB\u05D1\u05D9",
  "\u05DB\u05DC\u05DC\u05D9\u05EA",
  "\u05DE\u05D0\u05D5\u05D7\u05D3\u05EA",
  "\u05DC\u05D0\u05D5\u05DE\u05D9\u05EA",
  "\u05D3\u05E0\u05D8",
  "Dent",
  "\u05E4\u05D0\u05E8\u05DD",
  "Pharm",
  "\u05D1\u05D9\u05EA \u05DE\u05E8\u05E7\u05D7\u05EA",
  "\u05E8\u05D5\u05E4\u05D0",
  "\u05DE\u05E8\u05E4\u05D0\u05D4",
  "\u05D0\u05D5\u05E4\u05D8\u05D9\u05E7",
  "\u05D0\u05D5\u05E4\u05D8\u05D5\u05DE\u05D8\u05E8\u05D9\u05E1\u05D8",
  "\u05E4\u05E1\u05D9\u05DB\u05D5\u05DC\u05D5\u05D2"
];
var KIDS_EDU_KEYWORDS = [
  "PlaySmart",
  "\u05E4\u05DC\u05D9\u05D9 \u05E1\u05DE\u05D0\u05E8\u05D8",
  "\u05D7\u05D5\u05D2",
  "\u05D7\u05D5\u05D2\u05D9\u05DD",
  "\u05E6\u05D4\u05E8\u05D5\u05DF",
  "\u05E6\u05D4\u05E8\u05D9\u05D9\u05DD",
  "\u05D2\u05DF",
  "\u05D2\u05E0\u05D9 \u05D9\u05DC\u05D3\u05D9\u05DD",
  "\u05D1\u05D9\u05EA \u05E1\u05E4\u05E8",
  "\u05E9\u05DE\u05E8\u05D8\u05E3",
  "\u05DE\u05D8\u05E4\u05DC\u05EA",
  "\u05D9\u05DC\u05D3\u05D9\u05DD",
  "\u05DC\u05D9\u05DE\u05D5\u05D3"
];
var BEAUTY_KEYWORDS = [
  "\u05E1\u05E7\u05D9\u05DF",
  "Skin",
  "beauty",
  "\u05D1\u05D9\u05D5\u05D8\u05D9",
  "care",
  "\u05E7\u05D9\u05D9\u05E8",
  "\u05E7\u05D5\u05E1\u05DE\u05D8\u05D9\u05E7\u05D4",
  "Cosmetic",
  "\u05E1\u05E4\u05D0",
  "Spa",
  "\u05DE\u05E1\u05E4\u05E8\u05D4",
  "\u05DE\u05E2\u05E6\u05D1 \u05E9\u05D9\u05E2\u05E8",
  "\u05E6\u05D9\u05E4\u05D5\u05E8\u05E0\u05D9\u05D9\u05DD",
  "\u05DE\u05E0\u05D9\u05E7\u05D5\u05E8"
];
var ONE_TIME_INCOME_KEYWORDS = [
  "\u05DE\u05D2\u05D3\u05DC",
  // also appears as employer — disambiguate by amount/pattern
  "\u05E7\u05E8\u05DF \u05D4\u05E9\u05EA\u05DC\u05DE\u05D5\u05EA",
  "\u05D2\u05DE\u05DC",
  "\u05E7\u05D5\u05E4\u05EA \u05D2\u05DE\u05DC",
  "\u05E4\u05E0\u05E1\u05D9\u05D4",
  "\u05E4\u05D9\u05E6\u05D5\u05D9\u05D9\u05DD",
  "\u05E4\u05D3\u05D9\u05D5\u05DF",
  "\u05D4\u05D5\u05DF \u05D4\u05E9\u05EA\u05DC\u05DE\u05D5\u05EA",
  "\u05EA\u05DE\u05D5\u05E8\u05EA \u05E7\u05E8\u05DF"
];
var FOOD_KEYWORDS = [
  // Delivery / restaurants
  "\u05D5\u05D5\u05DC\u05D8",
  "Wolt",
  "10Bis",
  "\u05EA\u05DF \u05D1\u05D9\u05E1",
  "Mishloha",
  "\u05DE\u05E9\u05DC\u05D5\u05D7\u05D4",
  "Cibus",
  "\u05E1\u05D9\u05D1\u05D5\u05E1",
  "\u05DE\u05E1\u05E2\u05D3\u05D4",
  "Restaurant",
  "Cafe",
  "\u05E7\u05E4\u05D4",
  "Starbucks",
  "\u05E1\u05D8\u05D0\u05E8\u05D1\u05E7\u05E1",
  "\u05D0\u05E8\u05D5\u05DE\u05D4",
  "Aroma",
  // Supermarkets
  "\u05E9\u05D5\u05E4\u05E8\u05E1\u05DC",
  "Shufersal",
  "\u05E8\u05DE\u05D9 \u05DC\u05D5\u05D9",
  "Rami Levy",
  "\u05D5\u05D9\u05E7\u05D8\u05D5\u05E8\u05D9",
  "Victory",
  "\u05DE\u05D2\u05D4",
  "Mega",
  "\u05D8\u05D9\u05D1 \u05D8\u05E2\u05DD",
  "Tiv Taam",
  "\u05D0\u05D5\u05E9\u05E8 \u05E2\u05D3",
  "\u05D9\u05D5\u05D7\u05E0\u05E0\u05D5\u05E3",
  "\u05E1\u05D5\u05E4\u05E8"
];
var SUBSCRIPTION_KEYWORDS = [
  "Netflix",
  "\u05E0\u05D8\u05E4\u05DC\u05D9\u05E7\u05E1",
  "Spotify",
  "\u05E1\u05E4\u05D5\u05D8\u05D9\u05E4\u05D9\u05D9",
  "Apple",
  "iCloud",
  "Apple Music",
  "YouTube",
  "\u05D9\u05D5\u05D8\u05D9\u05D5\u05D1",
  "Disney",
  "\u05D3\u05D9\u05E1\u05E0\u05D9",
  "HBO",
  "Amazon Prime",
  "Adobe",
  "Microsoft 365",
  "Google One",
  "Notion",
  "NYT",
  "New York Times",
  "Times of Israel",
  "Calcalist",
  "Haaretz",
  "\u05D4\u05D0\u05E8\u05E5"
];
var BIT_PAYBOX_KEYWORDS = [
  "BIT",
  "\u05D1\u05D9\u05D8",
  "PayBox",
  "\u05E4\u05D9\u05D9\u05D1\u05D5\u05E7\u05E1",
  "PayPal",
  "\u05E4\u05D9\u05D9\u05E4\u05D0\u05DC"
];
var DEBT_KEYWORDS = [
  "\u05D4\u05DC\u05D5\u05D5\u05D0\u05D4",
  "\u05D4\u05D7\u05D6\u05E8",
  "\u05E8\u05D9\u05D1\u05D9\u05EA",
  "\u05EA\u05E9\u05DC\u05D5\u05DD \u05D4\u05DC\u05D5\u05D5\u05D0\u05D4",
  "Loan",
  "\u05DE\u05E9\u05DB\u05E0\u05EA\u05D0",
  "Mortgage"
];

// supabase/functions/super-service/extract_facts.ts
var ROWS_PER_SHEET_FLOOR = 300;
function containsSalaryKeyword(row) {
  const desc = (row.raw_description || "").toLowerCase();
  for (const k of SALARY_KEYWORDS) {
    if (desc.includes(k.toLowerCase())) return true;
  }
  return false;
}
function trimWithSalaryPriority(rows) {
  const groups = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const key = `${r.source}/${r.file_id}/${r.sheet}`;
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  const kept = [];
  const warnings = [];
  for (const [key, group] of groups) {
    if (group.length <= ROWS_PER_SHEET_FLOOR) {
      kept.push(...group);
      continue;
    }
    const salaryRows = [];
    const otherRows = [];
    for (const r of group) {
      (containsSalaryKeyword(r) ? salaryRows : otherRows).push(r);
    }
    const keepCount = Math.max(ROWS_PER_SHEET_FLOOR, salaryRows.length);
    const remainingSlots = Math.max(0, keepCount - salaryRows.length);
    const keptOthers = otherRows.slice(0, remainingSlots);
    kept.push(...salaryRows, ...keptOthers);
    const dropped = group.length - (salaryRows.length + keptOthers.length);
    if (dropped > 0) {
      warnings.push(`${key}: trimmed ${dropped} rows (kept ${salaryRows.length} salary + ${keptOthers.length} other)`);
    }
  }
  return { kept, warnings };
}
function extractFacts(rows, context) {
  const { kept, warnings } = trimWithSalaryPriority(rows);
  const months = /* @__PURE__ */ new Set();
  const filesPresent = { bank: false, credit_card: false };
  for (const r of kept) {
    if (r.date && r.date.length >= 7) months.add(r.date.slice(0, 7));
    if (r.source === "bank") filesPresent.bank = true;
    if (r.source === "credit_card") filesPresent.credit_card = true;
  }
  return {
    rows: kept,
    months_covered: Array.from(months).sort(),
    files_present: filesPresent,
    known_merchants_matched: [],
    // populated lazily by build_report_model via classify decisions
    parser_warnings: warnings,
    context
  };
}

// supabase/functions/super-service/classify/helpers.ts
function normalizeDesc(s) {
  if (!s) return "";
  return s.toLowerCase().replace(/[֑-ׇ]/g, "").replace(/[״"׳']/g, "").replace(/\s+/g, " ").trim();
}
function containsAny(row, keywords) {
  const norm = normalizeDesc(row.raw_description);
  for (const k of keywords) {
    if (norm.includes(normalizeDesc(k))) return k;
  }
  return null;
}
function monthOf(row) {
  return row.date.slice(0, 7);
}
function similarVendorRows(row, allRows) {
  const target = normalizeDesc(row.raw_description);
  return allRows.filter((r) => normalizeDesc(r.raw_description) === target);
}
function vendorFrequency(row, allRows) {
  const matches = similarVendorRows(row, allRows);
  const months = /* @__PURE__ */ new Set();
  for (const m of matches) months.add(monthOf(m));
  return { occurrences: matches.length, months_seen: Array.from(months).sort() };
}
function isRecurringMonthly(row, allRows) {
  return vendorFrequency(row, allRows).months_seen.length >= 2;
}
function amountVariance(row, allRows) {
  const same = similarVendorRows(row, allRows);
  if (same.length === 0) return { mean: 0, min: 0, max: 0, spreadRatio: 0 };
  const amts = same.map((r) => Math.abs(r.amount));
  const min = Math.min(...amts);
  const max = Math.max(...amts);
  const mean = amts.reduce((s, x) => s + x, 0) / amts.length;
  const spreadRatio = mean === 0 ? 0 : (max - min) / mean;
  return { mean, min, max, spreadRatio };
}
function rowRef(row) {
  return `${row.source}:${row.file_id}:${row.row_index}`;
}
function buildContext(allRows, context) {
  const normByRow = /* @__PURE__ */ new Map();
  for (const r of allRows) normByRow.set(r, normalizeDesc(r.raw_description));
  return { allRows, context, normByRow };
}

// supabase/functions/super-service/classify/rules_cc_dedup.ts
var ruleCcDedup = (row, _ctx) => {
  if (row.source !== "bank") return null;
  const match = containsAny(row, CC_INTERNAL_CHARGE_PHRASES);
  if (!match) return null;
  return {
    rule_id: `cc_dedup:${match}`,
    decision: "cc_charge_in_bank",
    confidence: "high"
  };
};

// supabase/functions/super-service/classify/rules_utilities.ts
var ruleUtilities = (row, _ctx) => {
  if (row.amount >= 0) return null;
  const match = containsAny(row, UTILITY_KEYWORDS);
  if (!match) return null;
  return {
    rule_id: `utility:${match}`,
    decision: "household_bill",
    confidence: "high"
  };
};

// supabase/functions/super-service/classify/rules_debt.ts
var ruleDebt = (row, _ctx) => {
  if (row.amount >= 0) return null;
  const match = containsAny(row, DEBT_KEYWORDS);
  if (!match) return null;
  return {
    rule_id: `debt:${match}`,
    decision: "debt_payment",
    confidence: "high"
  };
};

// supabase/functions/super-service/classify/rules_housing_rent.ts
var RENT_KEYWORDS = [
  "\u05E9\u05DB\u05D9\u05E8\u05D5\u05EA",
  '\u05E9\u05DB"\u05D3',
  "\u05E9\u05DB\u05F4\u05D3",
  "\u05E9\u05DB\u05E8 \u05D3\u05D9\u05E8\u05D4",
  '\u05E9\u05DB"\u05D3',
  "\u05D5\u05E2\u05D3 \u05D1\u05D9\u05EA"
];
var RENT_MIN = 1500;
var ruleHousingRent = (row, ctx) => {
  if (row.amount >= 0) return null;
  const matched = containsAny(row, RENT_KEYWORDS);
  if (!matched) return null;
  const absAmount = Math.abs(row.amount);
  if (absAmount < RENT_MIN) return null;
  const freq = vendorFrequency(row, ctx.allRows);
  if (freq.months_seen.length >= 2) {
    return {
      rule_id: `housing:rent_recurring:${matched}`,
      decision: "fixed_commitment",
      confidence: "high"
    };
  }
  return {
    rule_id: `housing:rent_single:${matched}`,
    decision: "fixed_commitment",
    confidence: "medium"
  };
};

// supabase/functions/super-service/classify/rules_bit_paybox.ts
var ruleBitPaybox = (row, _ctx) => {
  const match = containsAny(row, BIT_PAYBOX_KEYWORDS);
  if (!match) return null;
  return {
    rule_id: `bit_paybox:${match}`,
    decision: "review_only",
    confidence: "medium"
  };
};

// supabase/functions/super-service/classify/rules_subscriptions.ts
var ruleSubscriptions = (row, _ctx) => {
  if (row.amount >= 0) return null;
  const match = containsAny(row, SUBSCRIPTION_KEYWORDS);
  if (!match) return null;
  return {
    rule_id: `subscription:${match}`,
    decision: "review_only",
    confidence: "high"
  };
};

// supabase/functions/super-service/classify/rules_medical_kids_beauty.ts
var MEDICAL_NON_BLOCKING_MAX = 2e3;
var KIDS_NON_BLOCKING_MAX = 1e3;
var BEAUTY_NON_BLOCKING_MAX = 1e3;
var ruleMedicalKidsBeauty = (row, ctx) => {
  if (row.amount >= 0) return null;
  const absAmount = Math.abs(row.amount);
  const freq = vendorFrequency(row, ctx.allRows);
  const medical = containsAny(row, MEDICAL_KEYWORDS);
  if (medical) {
    if (freq.occurrences === 1 && absAmount < MEDICAL_NON_BLOCKING_MAX) {
      return {
        rule_id: `medical:one_time_small:${medical}`,
        decision: "non_blocking_item",
        confidence: "high"
      };
    }
    return {
      rule_id: `medical:recurring:${medical}`,
      decision: "flexible_spending",
      confidence: "medium"
    };
  }
  const kids = containsAny(row, KIDS_EDU_KEYWORDS);
  if (kids) {
    if (freq.occurrences === 1 && absAmount < KIDS_NON_BLOCKING_MAX) {
      return {
        rule_id: `kids:one_time_small:${kids}`,
        decision: "non_blocking_item",
        confidence: "high"
      };
    }
    if (freq.months_seen.length >= 2) {
      return {
        rule_id: `kids:recurring:${kids}`,
        decision: "fixed_commitment",
        confidence: "medium"
      };
    }
    return {
      rule_id: `kids:single:${kids}`,
      decision: "non_blocking_item",
      confidence: "medium"
    };
  }
  const beauty = containsAny(row, BEAUTY_KEYWORDS);
  if (beauty) {
    if (freq.occurrences === 1 && absAmount < BEAUTY_NON_BLOCKING_MAX) {
      return {
        rule_id: `beauty:one_time_small:${beauty}`,
        decision: "non_blocking_item",
        confidence: "high"
      };
    }
    return {
      rule_id: `beauty:flexible:${beauty}`,
      decision: "flexible_spending",
      confidence: "medium"
    };
  }
  return null;
};

// supabase/functions/super-service/classify/rules_flexible_wolt.ts
var ruleFlexibleWolt = (row, _ctx) => {
  if (row.amount >= 0) return null;
  const match = containsAny(row, FOOD_KEYWORDS);
  if (!match) return null;
  return {
    rule_id: `flexible_food:${match}`,
    decision: "flexible_spending",
    confidence: "high"
  };
};

// supabase/functions/super-service/classify/rules_recurring_promote.ts
var RECURRING_MIN_AMOUNT = 100;
var RECURRING_MIN_MONTHS = 2;
var STABLE_SPREAD_RATIO = 0.5;
var FLEXIBLE_SPREAD_RATIO_MAX = 1.2;
var ruleRecurringPromote = (row, ctx) => {
  if (row.amount >= 0) return null;
  const absAmount = Math.abs(row.amount);
  if (absAmount < RECURRING_MIN_AMOUNT) return null;
  const freq = vendorFrequency(row, ctx.allRows);
  if (freq.months_seen.length < RECURRING_MIN_MONTHS) return null;
  const { spreadRatio } = amountVariance(row, ctx.allRows);
  if (spreadRatio <= STABLE_SPREAD_RATIO) {
    return {
      rule_id: `recurring_promote:stable:${freq.months_seen.length}m`,
      decision: "fixed_commitment",
      confidence: spreadRatio < 0.2 ? "high" : "medium"
    };
  }
  if (spreadRatio <= FLEXIBLE_SPREAD_RATIO_MAX) {
    return {
      rule_id: `recurring_promote:flexible:${freq.months_seen.length}m`,
      decision: "flexible_spending",
      confidence: "medium"
    };
  }
  return null;
};

// supabase/functions/super-service/classify/rules_salary.ts
var LOW_VARIANCE_THRESHOLD = 0.15;
var ruleSalary = (row, ctx) => {
  if (row.amount <= 0) return null;
  const employer = containsAny(row, KNOWN_EMPLOYERS);
  const keyword = containsAny(row, SALARY_KEYWORDS);
  if (employer) {
    return {
      rule_id: `salary:employer_match:${employer}`,
      decision: "fixed_income",
      confidence: "high"
    };
  }
  if (keyword) {
    const recurring = isRecurringMonthly(row, ctx.allRows);
    if (!recurring) {
      return null;
    }
    const { spreadRatio } = amountVariance(row, ctx.allRows);
    if (spreadRatio <= LOW_VARIANCE_THRESHOLD) {
      return {
        rule_id: `salary:keyword_recurring:${keyword}`,
        decision: "fixed_income",
        confidence: "medium"
      };
    }
    return null;
  }
  return null;
};

// supabase/functions/super-service/classify/rules_partner_income.ts
var HIGH_VARIANCE_THRESHOLD = 0.2;
var rulePartnerIncome = (row, ctx) => {
  if (row.amount <= 0) return null;
  const partner = ctx.context.partner_name?.trim();
  const norm = (s) => s.toLowerCase();
  const hasPartner = !!partner && norm(row.raw_description).includes(norm(partner));
  const hasSalaryKeyword = !!containsAny(row, SALARY_KEYWORDS);
  if (!hasPartner && !hasSalaryKeyword) return null;
  const { spreadRatio, min, max } = amountVariance(row, ctx.allRows);
  const variesAcrossMonths = spreadRatio > HIGH_VARIANCE_THRESHOLD || min === 0 || max === 0;
  if (hasPartner && hasSalaryKeyword && variesAcrossMonths) {
    return {
      rule_id: "partner_salary:variable",
      decision: "variable_income",
      confidence: "high"
    };
  }
  if (hasPartner && variesAcrossMonths) {
    return {
      rule_id: "partner_transfer:variable",
      decision: "variable_income",
      confidence: "medium"
    };
  }
  if (hasSalaryKeyword && variesAcrossMonths) {
    return {
      rule_id: "salary_variable:no_employer",
      decision: "variable_income",
      confidence: "medium"
    };
  }
  if (hasPartner) {
    return {
      rule_id: "partner_transfer:uncertain",
      decision: "uncertain_income",
      confidence: "low"
    };
  }
  return null;
};

// supabase/functions/super-service/classify/rules_savings_onetime.ts
var RECURRING_PENSION_THRESHOLD = 3;
var ruleSavingsOnetime = (row, ctx) => {
  if (row.amount <= 0) return null;
  const match = containsAny(row, ONE_TIME_INCOME_KEYWORDS);
  if (!match) return null;
  const freq = vendorFrequency(row, ctx.allRows);
  if (freq.months_seen.length >= RECURRING_PENSION_THRESHOLD) {
    return {
      rule_id: `pension_recurring:${match}`,
      decision: "variable_income",
      confidence: "medium"
    };
  }
  return {
    rule_id: `one_time_income:${match}`,
    decision: "one_time_income_excluded",
    confidence: "high"
  };
};

// supabase/functions/super-service/classify/index.ts
var EXPENSE_RULES = [
  ruleCcDedup,
  // FIRST — never let CC charges through
  ruleUtilities,
  ruleDebt,
  // mortgages / loans
  ruleHousingRent,
  // rent (separate from mortgage)
  ruleBitPaybox,
  ruleSubscriptions,
  ruleMedicalKidsBeauty,
  ruleFlexibleWolt,
  ruleRecurringPromote
  // LAST — variance-aware: stable→fixed, variable→flexible
];
var INCOME_RULES = [
  ruleSavingsOnetime,
  // FIRST — מגדל / קרן השתלמות disambiguation
  ruleSalary,
  rulePartnerIncome,
  ruleBitPaybox
  // BIT/PayBox can also be incoming
];
function classify(facts) {
  const ctx = buildContext(facts.rows, facts.context);
  const decisions = [];
  const ccBankCharges = [];
  for (const row of facts.rows) {
    const isIncome = row.amount > 0;
    const rules = isIncome ? INCOME_RULES : EXPENSE_RULES;
    let result = null;
    for (const rule of rules) {
      result = rule(row, ctx);
      if (result) break;
    }
    if (!result) {
      result = {
        rule_id: "fallback:uncertain",
        decision: isIncome ? "uncertain_income" : "review_only",
        confidence: "low"
      };
    }
    decisions.push({
      row_ref: rowRef(row),
      rule_id: result.rule_id,
      decision: result.decision,
      confidence: result.confidence
    });
    if (result.decision === "cc_charge_in_bank") {
      ccBankCharges.push({ row_ref: rowRef(row), amount: Math.abs(row.amount) });
    }
  }
  const ccFileTotal = facts.rows.filter((r) => r.source === "credit_card" && r.amount < 0).reduce((s, r) => s + Math.abs(r.amount), 0);
  const bankDirectExpensesTotal = facts.rows.reduce((sum, row, i) => {
    if (row.source !== "bank") return sum;
    if (row.amount >= 0) return sum;
    if (decisions[i].decision === "cc_charge_in_bank") return sum;
    return sum + Math.abs(row.amount);
  }, 0);
  return {
    decisions,
    cc_dedup_report: {
      bank_charges_excluded: ccBankCharges,
      cc_file_total: ccFileTotal,
      bank_direct_expenses_total: bankDirectExpensesTotal
    }
  };
}

// supabase/functions/super-service/gate.ts
var MAX_BLOCKING_QUESTIONS = 5;
var ONE_TIME_INCOME_BLOCKING_MIN = 5e3;
var POSSIBLE_INTERNAL_XFER_MIN = 3e3;
var PARTNER_INCOME_MIN_TO_MATTER = 1e3;
var AMBIGUOUS_VENDOR_MONTHLY_MIN = 400;
var AMBIGUOUS_VENDOR_PATTERN = /חברה לפיתוח|מינהל|מועצה|רשות מקומית|עיריית|תאגיד מים|החברה למשק/i;
function rowsByRef(facts) {
  const m = /* @__PURE__ */ new Map();
  for (const r of facts.rows) {
    m.set(`${r.source}:${r.file_id}:${r.row_index}`, r);
  }
  return m;
}
function formatILS(n) {
  return "\u20AA" + Math.round(Math.abs(n)).toLocaleString("he-IL");
}
function checkPartnerIncome(facts, classification) {
  const partner = facts.context.partner_name?.trim();
  if (!partner) return null;
  const partnerDecisions = classification.decisions.filter(
    (d) => d.rule_id.startsWith("partner_") || d.rule_id.startsWith("salary_variable:no_employer")
  );
  if (partnerDecisions.length === 0) return null;
  const allHigh = partnerDecisions.every((d) => d.confidence === "high");
  if (allHigh && partnerDecisions.length >= 2) {
    const refMap2 = rowsByRef(facts);
    const amts2 = partnerDecisions.map((d) => refMap2.get(d.row_ref)).filter((r) => !!r).map((r) => Math.abs(r.amount));
    if (amts2.length >= 2) {
      const min2 = Math.min(...amts2), max2 = Math.max(...amts2);
      const spread = min2 > 0 ? (max2 - min2) / min2 : 1;
      if (spread < 0.3) return null;
    }
  }
  const refMap = rowsByRef(facts);
  const rows = partnerDecisions.map((d) => refMap.get(d.row_ref)).filter((r) => !!r);
  const materialRows = rows.filter((r) => Math.abs(r.amount) >= PARTNER_INCOME_MIN_TO_MATTER);
  if (materialRows.length === 0) return null;
  const amts = materialRows.map((r) => Math.abs(r.amount));
  const min = Math.min(...amts);
  const max = Math.max(...amts);
  const months = new Set(materialRows.map((r) => r.date.slice(0, 7))).size;
  const rangeStr = min === max ? formatILS(min) : `${formatILS(min)} \u05E2\u05D3 ${formatILS(max)}`;
  const question = {
    id: "q-partner-income",
    meta: "\u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05E9\u05EA\u05E0\u05D4",
    title: `\u05D4\u05D0\u05DD \u05D4\u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05DE${partner} \u05D4\u05DF \u05DE\u05E9\u05DB\u05D5\u05E8\u05EA \u05E7\u05D1\u05D5\u05E2\u05D4?`,
    context: `\u05DE\u05E6\u05D0\u05E0\u05D5 ${materialRows.length} \u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05DE${partner} \u05D1-${months} \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD \u05E9\u05D5\u05E0\u05D9\u05DD \u05D1\u05E1\u05DB\u05D5\u05DE\u05D9\u05DD ${rangeStr}. \u05D0\u05DD \u05D6\u05D5 \u05DE\u05E9\u05DB\u05D5\u05E8\u05EA \u05E7\u05D1\u05D5\u05E2\u05D4, \u05E0\u05D7\u05E9\u05D1 \u05D0\u05D7\u05E8\u05EA.`,
    options: [
      { value: "fixed", label: "\u05DB\u05DF \u2014 \u05E7\u05D1\u05D5\u05E2\u05D4" },
      { value: "variable", label: "\u05DC\u05D0 \u2014 \u05DE\u05E9\u05EA\u05E0\u05D4" },
      { value: "internal", label: "\u05D4\u05E2\u05D1\u05E8\u05D4 \u05E4\u05E0\u05D9\u05DE\u05D9\u05EA" }
    ],
    allow_dontknow: true,
    reason: "partner_or_business_income"
  };
  return { question, targets: materialRows.map((r) => `${r.source}:${r.file_id}:${r.row_index}`) };
}
function checkLargeOneTimeIncome(facts, classification) {
  const refMap = rowsByRef(facts);
  const candidates = [];
  for (const d of classification.decisions) {
    if (d.decision !== "one_time_income_excluded") continue;
    const row = refMap.get(d.row_ref);
    if (!row) continue;
    if (row.amount >= ONE_TIME_INCOME_BLOCKING_MIN) {
      candidates.push({ row, ref: d.row_ref });
    }
  }
  if (candidates.length === 0) return null;
  const total = candidates.reduce((s, c) => s + c.row.amount, 0);
  const firstRow = candidates[0].row;
  const sourceHint = firstRow.raw_description.slice(0, 30);
  const question = {
    id: "q-large-onetime-income",
    meta: "\u05E4\u05E8\u05D9\u05D8 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9",
    title: candidates.length === 1 ? `\u05D4\u05DB\u05E0\u05E1\u05D4 \u05E9\u05DC ${formatILS(total)} \u05DE${sourceHint} \u2014 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05EA?` : `${candidates.length} \u05EA\u05E7\u05D1\u05D5\u05DC\u05D9\u05DD \u05D2\u05D3\u05D5\u05DC\u05D9\u05DD \u2014 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05D9\u05DD?`,
    context: candidates.length === 1 ? `\u05DE\u05E6\u05D0\u05E0\u05D5 \u05EA\u05E7\u05D1\u05D5\u05DC \u05E9\u05DC ${formatILS(total)} \u05D1-${firstRow.date} (${sourceHint}). \u05D1\u05D3\u05E8\u05DA \u05DB\u05DC\u05DC \u05D6\u05D5 \u05E7\u05E8\u05DF \u05D4\u05E9\u05EA\u05DC\u05DE\u05D5\u05EA / \u05D2\u05DE\u05DC / \u05E4\u05D9\u05E6\u05D5\u05D9\u05D9\u05DD. \u05D0\u05DD \u05D6\u05D4 \u05D7\u05D5\u05D6\u05E8, \u05E0\u05E2\u05D3\u05DB\u05DF \u05D0\u05EA \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4.` : `\u05DE\u05E6\u05D0\u05E0\u05D5 ${candidates.length} \u05EA\u05E7\u05D1\u05D5\u05DC\u05D9\u05DD \u05D2\u05D3\u05D5\u05DC\u05D9\u05DD \u05D1\u05E1\u05DA \u05DB\u05D5\u05DC\u05DC \u05E9\u05DC ${formatILS(total)}. \u05E0\u05D7\u05E9\u05D1 \u05D0\u05D5\u05EA\u05DD \u05DB\u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05D9\u05DD \u05DB\u05D1\u05E8\u05D9\u05E8\u05EA \u05DE\u05D7\u05D3\u05DC.`,
    options: [
      { value: "one_time", label: "\u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05D9\u05DD" },
      { value: "recurring", label: "\u05D7\u05D5\u05D6\u05E8\u05D9\u05DD \u05D7\u05D5\u05D3\u05E9\u05D9\u05EA" }
    ],
    allow_dontknow: true,
    reason: "large_one_time_income"
  };
  return { question, targets: candidates.map((c) => c.ref) };
}
function checkPossibleInternalTransfer(facts, classification) {
  const refMap = rowsByRef(facts);
  const candidates = [];
  for (const d of classification.decisions) {
    if (d.rule_id !== "fallback:uncertain") continue;
    const row = refMap.get(d.row_ref);
    if (!row || row.source !== "bank" || row.amount >= 0) continue;
    if (Math.abs(row.amount) < POSSIBLE_INTERNAL_XFER_MIN) continue;
    const desc = row.raw_description.toLowerCase();
    const looksLikeTransfer = /העברה|transfer|חיסכון|פק[״"]?מ/i.test(desc);
    if (!looksLikeTransfer) continue;
    candidates.push({ row, ref: d.row_ref });
  }
  if (candidates.length === 0) return null;
  const total = candidates.reduce((s, c) => s + Math.abs(c.row.amount), 0);
  const sample = candidates[0].row.raw_description.slice(0, 40);
  const question = {
    id: "q-internal-transfer",
    meta: "\u05D4\u05E2\u05D1\u05E8\u05D4 \u05D2\u05D3\u05D5\u05DC\u05D4",
    title: candidates.length === 1 ? `\u05D4\u05E2\u05D1\u05E8\u05D4 \u05E9\u05DC ${formatILS(total)} \u2014 \u05DC\u05D7\u05E9\u05D1\u05D5\u05DF \u05E9\u05DC\u05DA?` : `${candidates.length} \u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05D2\u05D3\u05D5\u05DC\u05D5\u05EA \u2014 \u05DC\u05D7\u05E9\u05D1\u05D5\u05DF \u05E9\u05DC\u05DA?`,
    context: candidates.length === 1 ? `\u05DE\u05E6\u05D0\u05E0\u05D5 \u05D4\u05E2\u05D1\u05E8\u05D4 \u05D2\u05D3\u05D5\u05DC\u05D4 \u05D1-${candidates[0].row.date} (${sample}). \u05D0\u05DD \u05D6\u05D5 \u05D4\u05E2\u05D1\u05E8\u05D4 \u05DC\u05D7\u05E9\u05D1\u05D5\u05DF \u05D0\u05D7\u05E8 \u05E9\u05DC\u05DA (\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF, \u05E4\u05E7\u05F4\u05DE), \u05DC\u05D0 \u05E0\u05DB\u05DC\u05D5\u05DC \u05D0\u05D5\u05EA\u05D4 \u05D1\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA.` : `\u05DE\u05E6\u05D0\u05E0\u05D5 ${candidates.length} \u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05D2\u05D3\u05D5\u05DC\u05D5\u05EA \u05D1\u05E1\u05DA ${formatILS(total)}. \u05D0\u05DD \u05D4\u05DF \u05DC\u05D7\u05E9\u05D1\u05D5\u05DF \u05D0\u05D7\u05E8 \u05E9\u05DC\u05DA, \u05DC\u05D0 \u05E0\u05DB\u05DC\u05D5\u05DC \u05D0\u05D5\u05EA\u05DF \u05D1\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA.`,
    options: [
      { value: "internal", label: "\u05DB\u05DF \u2014 \u05D7\u05E9\u05D1\u05D5\u05DF \u05E9\u05DC\u05D9" },
      { value: "expense", label: "\u05DC\u05D0 \u2014 \u05D4\u05D5\u05E6\u05D0\u05D4 \u05D0\u05DE\u05D9\u05EA\u05D9\u05EA" }
    ],
    allow_dontknow: true,
    reason: "possible_internal_transfer"
  };
  return { question, targets: candidates.map((c) => c.ref) };
}
function checkAmbiguousVendor(facts, classification) {
  const refMap = rowsByRef(facts);
  const months = Math.max(1, facts.months_covered.length);
  const groups = /* @__PURE__ */ new Map();
  for (const d of classification.decisions) {
    const row = refMap.get(d.row_ref);
    if (!row || row.amount >= 0) continue;
    if (!AMBIGUOUS_VENDOR_PATTERN.test(row.raw_description)) continue;
    if (d.decision === "cc_charge_in_bank" || d.decision === "internal_transfer_excluded" || d.decision === "one_time_income_excluded") continue;
    const key = row.raw_description.replace(/\s+/g, " ").trim().toLowerCase();
    const prev = groups.get(key) ?? { sample: row, refs: [], total: 0, months: /* @__PURE__ */ new Set() };
    prev.refs.push(d.row_ref);
    prev.total += Math.abs(row.amount);
    prev.months.add(row.date.slice(0, 7));
    groups.set(key, prev);
  }
  const candidates = Array.from(groups.values()).map((g) => ({ ...g, monthly: g.total / months })).filter((g) => g.monthly >= AMBIGUOUS_VENDOR_MONTHLY_MIN).sort((a, b) => b.monthly - a.monthly);
  if (candidates.length === 0) return null;
  const top = candidates[0];
  const label = top.sample.cleaned_name || top.sample.raw_description;
  const question = {
    id: "q-ambiguous-vendor",
    meta: "\u05EA\u05E9\u05DC\u05D5\u05DD \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4",
    title: `\u05DE\u05D4 \u05D6\u05D4 \u05D4\u05EA\u05E9\u05DC\u05D5\u05DD \u05D4\u05D7\u05D5\u05D6\u05E8 \u05DC"${label}"?`,
    context: `\u05DE\u05E6\u05D0\u05E0\u05D5 \u05EA\u05E9\u05DC\u05D5\u05DD \u05D7\u05D5\u05D6\u05E8 \u05E9\u05DC ${formatILS(top.monthly)}/\u05D7\u05D5\u05D3\u05E9 (${top.months.size} \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD). \u05D0\u05E0\u05D7\u05E0\u05D5 \u05DC\u05D0 \u05D9\u05D5\u05D3\u05E2\u05D9\u05DD \u05D0\u05DD \u05D6\u05D4 \u05D0\u05E8\u05E0\u05D5\u05E0\u05D4, \u05DE\u05D9\u05DD, \u05D7\u05D9\u05E0\u05D5\u05DA \u05D0\u05D5 \u05DE\u05E9\u05D4\u05D5 \u05D0\u05D7\u05E8 \u2014 \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D9\u05E9\u05E4\u05D9\u05E2 \u05E2\u05DC \u05D0\u05D9\u05DA \u05D6\u05D4 \u05DE\u05D5\u05E6\u05D2 \u05D1\u05D3\u05D5\u05D7.`,
    options: [
      { value: "municipal", label: "\u05D0\u05E8\u05E0\u05D5\u05E0\u05D4 / \u05DE\u05D9\u05DD / \u05DE\u05D5\u05E2\u05E6\u05D4" },
      { value: "education", label: "\u05D7\u05D9\u05E0\u05D5\u05DA / \u05D7\u05D5\u05D2\u05D9\u05DD / \u05E6\u05D4\u05E8\u05D5\u05DF" },
      { value: "other_fixed", label: "\u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA \u05D0\u05D7\u05E8\u05EA" },
      { value: "one_time", label: "\u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9, \u05DC\u05D0 \u05D7\u05D5\u05D6\u05E8" }
    ],
    allow_dontknow: true,
    reason: "ambiguous_municipal_vendor"
  };
  return { question, targets: top.refs };
}
var QUESTION_CHECKS = [
  checkPartnerIncome,
  checkLargeOneTimeIncome,
  checkPossibleInternalTransfer,
  checkAmbiguousVendor
  // checkMissingCriticalFile is reserved but currently returns null
];
function clarificationGate(facts, classification) {
  const questions = [];
  const targets = {};
  for (const check of QUESTION_CHECKS) {
    if (questions.length >= MAX_BLOCKING_QUESTIONS) break;
    const result = check(facts, classification);
    if (!result) continue;
    questions.push(result.question);
    targets[result.question.id] = result.targets;
  }
  return { blocking_questions: questions, question_targets: targets };
}

// supabase/functions/super-service/apply_answers.ts
function decisionAfterAnswer(questionId, choice, before) {
  if (choice === "unknown") return null;
  if (questionId === "q-partner-income") {
    if (choice === "fixed") return "fixed_income";
    if (choice === "variable") return before === "variable_income" ? null : "variable_income";
    if (choice === "internal") return "internal_transfer_excluded";
  }
  if (questionId === "q-large-onetime-income") {
    if (choice === "one_time") return null;
    if (choice === "recurring") return "variable_income";
  }
  if (questionId === "q-internal-transfer") {
    if (choice === "internal") return "internal_transfer_excluded";
    if (choice === "expense") return null;
  }
  if (questionId === "q-ambiguous-vendor") {
    if (choice === "municipal" || choice === "education" || choice === "other_fixed") {
      return before === "fixed_commitment" ? null : "fixed_commitment";
    }
    if (choice === "one_time") {
      return before === "one_time_expense" ? null : "one_time_expense";
    }
  }
  return null;
}
function applyAnswers(facts, classification, answers) {
  const gate = clarificationGate(facts, classification);
  const targets = gate.question_targets;
  const byRef = new Map(classification.decisions.map((d) => [d.row_ref, d]));
  const overrides = [];
  for (const ans of answers) {
    const affectedRefs = targets[ans.question_id];
    if (!affectedRefs || affectedRefs.length === 0) continue;
    for (const ref of affectedRefs) {
      const d = byRef.get(ref);
      if (!d) continue;
      const after = decisionAfterAnswer(ans.question_id, ans.choice, d.decision);
      if (!after || after === d.decision) continue;
      overrides.push({ question_id: ans.question_id, before: d.decision, after });
      byRef.set(ref, {
        ...d,
        decision: after,
        rule_id: `user_override:${ans.question_id}:${ans.choice}`,
        confidence: "high"
      });
    }
  }
  const newDecisions = classification.decisions.map((d) => byRef.get(d.row_ref) ?? d);
  return {
    classification: {
      decisions: newDecisions,
      cc_dedup_report: classification.cc_dedup_report
    },
    overrides
  };
}

// supabase/functions/super-service/validators/invariants.ts
var InvariantViolationError = class extends Error {
  invariant;
  detail;
  constructor(invariant, detail) {
    super(`Invariant violation: ${invariant} \u2014 ${detail}`);
    this.invariant = invariant;
    this.detail = detail;
  }
};
var ILS_EPSILON = 1;
function approxEqual(a, b) {
  return Math.abs(a - b) <= ILS_EPSILON;
}
function assertMonthlyExpenseSum(model) {
  const e = model.expense_model;
  const sum = e.fixed_commitments.reduce((s, x) => s + x.monthly_amount, 0) + e.debt_payments.reduce((s, x) => s + x.monthly_amount, 0) + e.flexible_spending.reduce((s, x) => s + x.monthly_avg, 0);
  if (!approxEqual(sum, model.summary.monthly_expenses_total)) {
    throw new InvariantViolationError(
      "monthly_expense_sum",
      `categories sum to ${sum} but summary.monthly_expenses_total is ${model.summary.monthly_expenses_total}`
    );
  }
}
function assertGapSign(model) {
  const s = model.summary;
  const computedGap = s.monthly_income_fixed - s.monthly_expenses_total;
  if (s.monthly_gap > 0 && s.gap_label === "\u05D7\u05D5\u05E1\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9") {
    throw new InvariantViolationError("gap_sign", "positive gap labeled as deficit");
  }
  if (s.monthly_gap < 0 && s.gap_label === "\u05E2\u05D5\u05D3\u05E3 \u05DE\u05D7\u05D5\u05E9\u05D1") {
    throw new InvariantViolationError("gap_sign", "negative gap labeled as surplus");
  }
  if (model.display_mode === "single_scenario" && !approxEqual(s.monthly_gap, computedGap)) {
    throw new InvariantViolationError(
      "gap_value",
      `single_scenario: gap ${s.monthly_gap} != income-expenses ${computedGap}`
    );
  }
}
function assertNoMonthlyOnOneTime(model) {
  const monthly = /\/\s*חודש|לחודש|בחודש/;
  const violations = [];
  for (const item of model.income_model.one_time_excluded) {
    if (monthly.test(item.label)) violations.push(`income_model.one_time_excluded: "${item.label}"`);
  }
  for (const item of model.expense_model.one_time_expenses) {
    if (monthly.test(item.label)) violations.push(`expense_model.one_time_expenses: "${item.label}"`);
  }
  for (const item of model.non_blocking_items) {
    if (monthly.test(item.label)) violations.push(`non_blocking_items: "${item.label}"`);
  }
  if (violations.length > 0) {
    throw new InvariantViolationError("no_monthly_on_one_time", violations.join("; "));
  }
}
function assertNoEmptyEvidence(model) {
  const checks = [
    ...model.expense_model.fixed_commitments.map((x) => ({
      label: `fixed_commitments: ${x.label}`,
      total: x.monthly_amount,
      evidenceCount: x.evidence?.length ?? 0
    })),
    ...model.expense_model.flexible_spending.map((x) => ({
      label: `flexible_spending: ${x.label}`,
      total: x.monthly_avg,
      evidenceCount: x.evidence?.length ?? 0
    }))
  ];
  for (const c of checks) {
    if (c.total > 0 && c.evidenceCount === 0) {
    }
  }
}
function assertAllInvariants(model) {
  assertMonthlyExpenseSum(model);
  assertGapSign(model);
  assertNoMonthlyOnOneTime(model);
  assertNoEmptyEvidence(model);
}

// supabase/functions/super-service/playbook_adapter.ts
var RE_WOLT = /wolt|10bis|תן ביס|tenbis/i;
var RE_RESTAURANTS = /מסעדה|cafe|קפה|בורגר|פיצה|סושי/i;
var RE_SUBSCRIPTIONS = /netflix|spotify|icloud|apple\.com|disney|hbo|youtube|chatgpt|openai|מנוי|amazon prime/i;
var RE_PAYMENT_APPS = /\bbit\b|paybox|paypal/i;
var RE_MUNICIPAL = /ארנונה|עירייה|מי\s|תאגיד מים|חינוך|חוג|צהרון|בית ספר/i;
var RE_MEDICAL = /מכבי|כללית|לאומית|מאוחדת|דנט|פארם|בית מרקחת|רופא|רופאה|maccabident/i;
var RE_HOUSING = /משכנת|שכירות|שכ"?ד|ארנונה|ועד בית/i;
var RE_INTEREST = /ריבית|מינוס|עמלת מסגרת|חריגה|overdraft/i;
var RE_LARGE_CHECK = /שיק|המחאה/i;
var RE_SEASONAL = /חגים|חג |פסח|ראש השנה|סוכות|קייטנה|חזרה ללימודים|מתנות/i;
var RE_BUSINESS = /חשבונית|מע"?מ|reimbursement|החזר ?הוצא/i;
var LARGE_CHECK_MIN = 1e3;
function safeMonths(facts) {
  return Math.max(1, facts.months_covered.length);
}
function mapReportType(rt) {
  switch (rt) {
    case "full":
      return "full";
    case "partial_bank_only":
      return "partial_bank_only";
    case "partial_credit_only":
      return "partial_cc_only";
    case "low_confidence":
      return "insufficient_data";
    default:
      return "full";
  }
}
function sumMonthlyByRegex(items, regex) {
  let s = 0;
  for (const i of items) {
    if (!regex.test(i.label)) continue;
    s += i.monthly_amount ?? i.monthly_avg ?? 0;
  }
  return s;
}
function sumOneTimeExpensesByCategoryRegex(items, regex) {
  let s = 0;
  for (const i of items) {
    const hit = regex.test(i.label) || regex.test(i.category);
    if (hit) s += i.amount;
  }
  return s;
}
function sumReviewOnlyMonthly(items, regex, months) {
  let s = 0;
  for (const i of items) {
    if (!regex.test(i.label)) continue;
    if (typeof i.monthly_avg === "number") {
      s += i.monthly_avg;
    } else if (typeof i.period_total === "number") {
      s += i.period_total / months;
    }
  }
  return s;
}
function factsToPlaybookFacts(facts, model) {
  const months = safeMonths(facts);
  const summary = model.summary;
  const expense = model.expense_model;
  const income = model.income_model;
  const fixedMonthlyIncome = summary.monthly_income_fixed;
  const monthlyExpenses = summary.monthly_expenses_total;
  let varAvg = 0, varMin = 0, varMax = 0;
  const varMonthsSet = /* @__PURE__ */ new Set();
  for (const v of income.variable) {
    varAvg += v.range.avg;
    varMin += v.range.min;
    varMax += v.range.max;
    for (const e of v.evidence) {
      if (e.date) varMonthsSet.add(e.date.slice(0, 7));
    }
  }
  const variableIncomeMonthsSeen = Array.from(varMonthsSet).sort();
  const fixedOnlyGap = fixedMonthlyIncome - monthlyExpenses;
  const withVariableGap = fixedMonthlyIncome + varAvg - monthlyExpenses;
  const hasMaterialVariableIncome = varAvg > 0 && (varAvg > fixedMonthlyIncome * 0.1 || fixedMonthlyIncome < monthlyExpenses);
  const oneTimeIncomeExcludedTotal = income.one_time_excluded.reduce(
    (s, x) => s + Math.abs(x.amount),
    0
  );
  const oneTimeExpenseTotal = expense.one_time_expenses.reduce(
    (s, x) => s + Math.abs(x.amount),
    0
  );
  const debtMonthlyPaymentTotal = expense.debt_payments.reduce(
    (s, d) => s + (d.monthly_amount ?? 0),
    0
  );
  const debtBalanceTotal = expense.debt_payments.reduce(
    (s, d) => s + (d.balance ?? 0),
    0
  );
  const overdraftInterestMonthly = sumMonthlyByRegex(expense.fixed_commitments, RE_INTEREST) + sumMonthlyByRegex(expense.debt_payments, RE_INTEREST);
  const housingMonthly = expense.fixed_commitments.filter((c) => c.category === "\u05D3\u05D9\u05D5\u05E8" || RE_HOUSING.test(c.label)).reduce((s, c) => s + (c.monthly_amount ?? 0), 0);
  const fixedCommitmentsMonthly = expense.fixed_commitments.reduce((s, c) => s + (c.monthly_amount ?? 0), 0) + debtMonthlyPaymentTotal;
  const woltMonthly = expense.flexible_spending.reduce(
    (s, f) => RE_WOLT.test(f.label) ? s + (f.monthly_avg ?? 0) : s,
    0
  );
  const restaurantsMonthly = expense.flexible_spending.reduce((s, f) => {
    if (RE_WOLT.test(f.label)) return s;
    if (RE_RESTAURANTS.test(f.label) || f.category === "\u05DE\u05D6\u05D5\u05DF \u05D1\u05D7\u05D5\u05E5") {
      return s + (f.monthly_avg ?? 0);
    }
    return s;
  }, 0);
  const subscriptionsMonthly = sumReviewOnlyMonthly(
    expense.review_only_items,
    RE_SUBSCRIPTIONS,
    months
  );
  const paymentAppsMonthly = sumReviewOnlyMonthly(
    expense.review_only_items,
    RE_PAYMENT_APPS,
    months
  );
  const municipalMonthly = sumMonthlyByRegex(
    expense.fixed_commitments,
    RE_MUNICIPAL
  );
  const medicalOneTimeTotal = sumOneTimeExpensesByCategoryRegex(
    expense.one_time_expenses,
    RE_MEDICAL
  );
  const seasonalFamilyExpensesTotal = sumOneTimeExpensesByCategoryRegex(
    expense.one_time_expenses,
    RE_SEASONAL
  );
  const businessOrReimbursablePossibleTotal = sumOneTimeExpensesByCategoryRegex(
    expense.one_time_expenses,
    RE_BUSINESS
  );
  let recurringLargeChecksTotal = 0;
  for (const c of expense.fixed_commitments) {
    if (RE_LARGE_CHECK.test(c.label) && c.monthly_amount >= LARGE_CHECK_MIN) {
      recurringLargeChecksTotal += c.monthly_amount;
    }
  }
  for (const d of expense.debt_payments) {
    if (RE_LARGE_CHECK.test(d.label) && d.monthly_amount >= LARGE_CHECK_MIN) {
      recurringLargeChecksTotal += d.monthly_amount;
    }
  }
  const internalTransferRiskTotal = paymentAppsMonthly * months;
  const missingIncomeLikely = !hasMaterialVariableIncome && fixedMonthlyIncome > 0 && monthlyExpenses > fixedMonthlyIncome * 1.25;
  return {
    reportType: mapReportType(model.report_type),
    monthsDetected: facts.months_covered.length,
    hasBankFile: facts.files_present.bank,
    hasCreditCardFile: facts.files_present.credit_card,
    fixedMonthlyIncome,
    variableIncomeMonthlyAvg: varAvg,
    variableIncomeMin: varMin,
    variableIncomeMax: varMax,
    variableIncomeMonthsSeen,
    monthlyExpenses,
    fixedOnlyGap,
    withVariableGap,
    oneTimeIncomeExcludedTotal,
    oneTimeExpenseTotal,
    debtBalanceTotal,
    debtMonthlyPaymentTotal,
    overdraftInterestMonthly,
    housingMonthly,
    fixedCommitmentsMonthly,
    woltMonthly,
    restaurantsMonthly,
    subscriptionsMonthly,
    subscriptionsDuplicateEvidenceAmount: 0,
    // TODO: requires duplicate-detection rule
    paymentAppsMonthly,
    municipalMonthly,
    medicalOneTimeTotal,
    seasonalFamilyExpensesTotal,
    businessOrReimbursablePossibleTotal,
    recurringLargeChecksTotal,
    internalTransferRiskTotal,
    missingIncomeLikely,
    hasMaterialVariableIncome,
    dataConfidence: model.data_confidence
  };
}

// supabase/functions/super-service/playbooks.ts
var FINAL_REPORT_SECTION_ORDER = [
  "work_done",
  "bottom_line",
  "meaning",
  "scenario_comparison",
  "check_first",
  "control_opportunities",
  "details_by_area",
  "classify_later",
  "audit_trail",
  "export"
];
var PLAYBOOKS = {
  // 1
  partial_credit_only: {
    id: "partial_credit_only",
    kind: "data_quality",
    priority: 1e3,
    label: "\u05E0\u05D9\u05EA\u05D5\u05D7 \u05D7\u05DC\u05E7\u05D9 \u2014 \u05E8\u05E7 \u05DB\u05E8\u05D8\u05D9\u05E1\u05D9 \u05D0\u05E9\u05E8\u05D0\u05D9",
    healthTone: "yellow",
    trigger: {
      description: "Credit card files exist, bank statement is missing.",
      test: (f) => f.hasCreditCardFile && !f.hasBankFile
    },
    userFear: "\u05D0\u05E0\u05D9 \u05E8\u05D5\u05D0\u05D4 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D0\u05D1\u05DC \u05DC\u05D0 \u05D9\u05D5\u05D3\u05E2\u05EA \u05D0\u05DD \u05D9\u05E9 \u05D7\u05D5\u05E1\u05E8 \u05D0\u05D5 \u05E2\u05D5\u05D3\u05E3.",
    mainAha: "\u05E8\u05D5\u05D0\u05D9\u05DD \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D0\u05E9\u05E8\u05D0\u05D9, \u05D0\u05D1\u05DC \u05D1\u05DC\u05D9 \u05E2\u05D5\u05F4\u05E9 \u05D0\u05D9 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D7\u05E9\u05D1 \u05E9\u05D5\u05E8\u05D4 \u05EA\u05D7\u05EA\u05D5\u05E0\u05D4 \u05DE\u05DC\u05D0\u05D4.",
    ui: {
      bottomLineHeadline: "\u05E0\u05D9\u05EA\u05D5\u05D7 \u05D7\u05DC\u05E7\u05D9 \u2014 \u05E8\u05D5\u05D0\u05D9\u05DD \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D0\u05E9\u05E8\u05D0\u05D9, \u05D0\u05D1\u05DC \u05DC\u05D0 \u05D4\u05DB\u05E0\u05E1\u05D5\u05EA \u05D5\u05E2\u05D5\u05F4\u05E9",
      meaningTitle: "\u05DE\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D4\u05D1\u05D9\u05DF \u05DB\u05E8\u05D2\u05E2",
      meaningBody: "\u05D0\u05E4\u05E9\u05E8 \u05DC\u05E8\u05D0\u05D5\u05EA \u05D3\u05E4\u05D5\u05E1\u05D9 \u05D4\u05D5\u05E6\u05D0\u05D4, \u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05D5\u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05D2\u05DE\u05D9\u05E9\u05D9\u05DD. \u05D0\u05D9 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D7\u05E9\u05D1 \u05E4\u05E2\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9 \u05DE\u05DC\u05D0 \u05D1\u05DC\u05D9 \u05E7\u05D5\u05D1\u05E5 \u05E2\u05D5\u05F4\u05E9.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D4\u05E9\u05DC\u05D9\u05DD \u05DB\u05D3\u05D9 \u05DC\u05D3\u05D9\u05D9\u05E7",
      controlTitle: "\u05DE\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05DB\u05D1\u05E8 \u05E2\u05DB\u05E9\u05D9\u05D5",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D0\u05E9\u05E8\u05D0\u05D9",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05D4\u05D7\u05DC\u05E7\u05D9\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: [
      "work_done",
      "bottom_line",
      "meaning",
      "check_first",
      "control_opportunities",
      "details_by_area",
      "classify_later",
      "export"
    ],
    primaryActions: [
      {
        title: "\u05DC\u05D4\u05E2\u05DC\u05D5\u05EA \u05E7\u05D5\u05D1\u05E5 \u05E2\u05D5\u05F4\u05E9 \u05DB\u05D3\u05D9 \u05DC\u05D7\u05E9\u05D1 \u05E9\u05D5\u05E8\u05D4 \u05EA\u05D7\u05EA\u05D5\u05E0\u05D4",
        whyFirst: "\u05D1\u05DC\u05D9 \u05D4\u05DB\u05E0\u05E1\u05D5\u05EA \u05D5\u05EA\u05E0\u05D5\u05E2\u05D5\u05EA \u05D1\u05E0\u05E7 \u05D0\u05D9 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D3\u05E2\u05EA \u05D0\u05DD \u05D9\u05E9 \u05E2\u05D5\u05D3\u05E3 \u05D0\u05D5 \u05D7\u05D5\u05E1\u05E8.",
        whatToDo: "\u05D4\u05E2\u05DC\u05D5 3 \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD \u05E9\u05DC \u05E2\u05D5\u05F4\u05E9 \u05DE\u05D0\u05D5\u05EA\u05D5 \u05E4\u05E8\u05E7 \u05D6\u05DE\u05DF.",
        amountType: "no_amount"
      }
    ],
    allowedClaims: ["\u05D0\u05E4\u05E9\u05E8 \u05DC\u05E0\u05EA\u05D7 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D0\u05E9\u05E8\u05D0\u05D9", "\u05D0\u05D9 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D7\u05E9\u05D1 \u05E4\u05E2\u05E8 \u05DE\u05DC\u05D0"],
    forbiddenClaims: ["\u05D7\u05D5\u05E1\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9", "\u05E2\u05D5\u05D3\u05E3 \u05DE\u05D7\u05D5\u05E9\u05D1", "\u05E9\u05D5\u05E8\u05D4 \u05EA\u05D7\u05EA\u05D5\u05E0\u05D4 \u05DE\u05DC\u05D0\u05D4"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["subscriptions", "restaurants", "wolt", "known merchants"]
    },
    evidenceRules: ["Show credit-card evidence only.", "Do not invent income."],
    claudeCopyHints: {
      tone: "transparent and calm",
      doSay: ["\u05E0\u05D9\u05EA\u05D5\u05D7 \u05D7\u05DC\u05E7\u05D9", "\u05DB\u05D3\u05D9 \u05DC\u05D7\u05E9\u05D1 \u05E9\u05D5\u05E8\u05D4 \u05EA\u05D7\u05EA\u05D5\u05E0\u05D4 \u05E6\u05E8\u05D9\u05DA \u05E2\u05D5\u05F4\u05E9"],
      doNotSay: ["\u05D9\u05E9 \u05D7\u05D5\u05E1\u05E8", "\u05D9\u05E9 \u05E2\u05D5\u05D3\u05E3", "\u05D4\u05DE\u05E6\u05D1 \u05D7\u05DE\u05D5\u05E8"]
    }
  },
  // 2
  partial_bank_only: {
    id: "partial_bank_only",
    kind: "data_quality",
    priority: 999,
    label: "\u05E0\u05D9\u05EA\u05D5\u05D7 \u05D7\u05DC\u05E7\u05D9 \u2014 \u05E8\u05E7 \u05E2\u05D5\u05F4\u05E9",
    healthTone: "yellow",
    trigger: {
      description: "Bank file exists, credit card files are missing.",
      test: (f) => f.hasBankFile && !f.hasCreditCardFile
    },
    userFear: "\u05E8\u05D5\u05D0\u05D9\u05DD \u05DB\u05E1\u05E3 \u05E0\u05DB\u05E0\u05E1 \u05D5\u05D9\u05D5\u05E6\u05D0 \u05D0\u05D1\u05DC \u05DC\u05D0 \u05E8\u05D5\u05D0\u05D9\u05DD \u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA.",
    mainAha: "\u05E8\u05D5\u05D0\u05D9\u05DD \u05EA\u05D6\u05E8\u05D9\u05DD \u05D1\u05E0\u05E7, \u05D0\u05D1\u05DC \u05DC\u05D0 \u05D0\u05EA \u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05E2\u05E1\u05E7\u05D0\u05D5\u05EA \u05D1\u05DB\u05E8\u05D8\u05D9\u05E1\u05D9 \u05D0\u05E9\u05E8\u05D0\u05D9.",
    ui: {
      bottomLineHeadline: "\u05E0\u05D9\u05EA\u05D5\u05D7 \u05D7\u05DC\u05E7\u05D9 \u2014 \u05E8\u05D5\u05D0\u05D9\u05DD \u05E2\u05D5\u05F4\u05E9, \u05D0\u05D1\u05DC \u05DC\u05D0 \u05E4\u05D9\u05E8\u05D5\u05D8 \u05D0\u05E9\u05E8\u05D0\u05D9",
      meaningTitle: "\u05DE\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D4\u05D1\u05D9\u05DF \u05DB\u05E8\u05D2\u05E2",
      meaningBody: "\u05D0\u05E4\u05E9\u05E8 \u05DC\u05E8\u05D0\u05D5\u05EA \u05D4\u05DB\u05E0\u05E1\u05D5\u05EA, \u05E9\u05D9\u05E7\u05D9\u05DD, \u05D4\u05DC\u05D5\u05D5\u05D0\u05D5\u05EA \u05D5\u05D4\u05E2\u05D1\u05E8\u05D5\u05EA. \u05D0\u05D9 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E4\u05E8\u05E7 \u05D0\u05EA \u05DB\u05DC \u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D1\u05DC\u05D9 \u05E7\u05D1\u05E6\u05D9 \u05D0\u05E9\u05E8\u05D0\u05D9.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D4\u05E9\u05DC\u05D9\u05DD \u05DB\u05D3\u05D9 \u05DC\u05D3\u05D9\u05D9\u05E7",
      controlTitle: "\u05DE\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05DB\u05D1\u05E8 \u05E2\u05DB\u05E9\u05D9\u05D5",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05EA\u05D6\u05E8\u05D9\u05DD \u05E2\u05D5\u05F4\u05E9",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05D4\u05D7\u05DC\u05E7\u05D9\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: [
      "work_done",
      "bottom_line",
      "meaning",
      "check_first",
      "details_by_area",
      "classify_later",
      "export"
    ],
    primaryActions: [
      {
        title: "\u05DC\u05D4\u05E2\u05DC\u05D5\u05EA \u05E4\u05D9\u05E8\u05D5\u05D8\u05D9 \u05D0\u05E9\u05E8\u05D0\u05D9 \u05DC\u05D0\u05D5\u05EA\u05D4 \u05EA\u05E7\u05D5\u05E4\u05D4",
        whyFirst: "\u05D7\u05D9\u05D5\u05D1 \u05DB\u05E8\u05D8\u05D9\u05E1 \u05D1\u05E2\u05D5\u05F4\u05E9 \u05D4\u05D5\u05D0 \u05E1\u05DB\u05D5\u05DD \u05D0\u05D7\u05D3, \u05DC\u05D0 \u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA.",
        whatToDo: "\u05D4\u05E2\u05DC\u05D5 \u05E7\u05D1\u05E6\u05D9 \u05D0\u05E9\u05E8\u05D0\u05D9 \u05E9\u05DC \u05D0\u05D5\u05EA\u05DD \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD.",
        amountType: "no_amount"
      }
    ],
    allowedClaims: ["\u05D0\u05E4\u05E9\u05E8 \u05DC\u05D6\u05D4\u05D5\u05EA \u05D4\u05DB\u05E0\u05E1\u05D5\u05EA \u05D5\u05EA\u05E0\u05D5\u05E2\u05D5\u05EA \u05D1\u05E0\u05E7", "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D7\u05E1\u05E8"],
    forbiddenClaims: ["\u05E4\u05D9\u05E8\u05D5\u05D8 \u05DE\u05DC\u05D0 \u05E9\u05DC \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA", "\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DC\u05E4\u05D9 \u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D5\u05EA \u05D0\u05E9\u05E8\u05D0\u05D9"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["large unclear income", "large recurring checks"],
      neverBlockFor: ["utilities", "known merchants"]
    },
    evidenceRules: ["Do not categorize hidden credit card spend."],
    claudeCopyHints: {
      tone: "transparent",
      doSay: ["\u05D4\u05E0\u05D9\u05EA\u05D5\u05D7 \u05D7\u05DC\u05E7\u05D9", "\u05D7\u05E1\u05E8 \u05E4\u05D9\u05E8\u05D5\u05D8 \u05D0\u05E9\u05E8\u05D0\u05D9"],
      doNotSay: ["\u05D6\u05D9\u05D4\u05D9\u05E0\u05D5 \u05D0\u05EA \u05DB\u05DC \u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA"]
    }
  },
  // 3
  insufficient_data: {
    id: "insufficient_data",
    kind: "data_quality",
    priority: 998,
    label: "\u05D0\u05D9\u05DF \u05DE\u05E1\u05E4\u05D9\u05E7 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD",
    healthTone: "neutral",
    trigger: {
      description: "Not enough data, no files, too few rows, or parse confidence low.",
      test: (f) => f.reportType === "insufficient_data" || f.dataConfidence === "low"
    },
    userFear: "\u05D4\u05E2\u05DC\u05D9\u05EA\u05D9 \u05E7\u05D5\u05D1\u05E5 \u05D0\u05D1\u05DC \u05D4\u05DE\u05E2\u05E8\u05DB\u05EA \u05DC\u05D0 \u05DE\u05D1\u05D9\u05E0\u05D4 \u05DE\u05E1\u05E4\u05D9\u05E7.",
    mainAha: "\u05D0\u05D9\u05DF \u05DE\u05E1\u05E4\u05D9\u05E7 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05DB\u05D3\u05D9 \u05DC\u05EA\u05EA \u05D0\u05D1\u05D7\u05D5\u05DF \u05D0\u05DE\u05D9\u05DF.",
    ui: {
      bottomLineHeadline: "\u05D0\u05D9\u05DF \u05DE\u05E1\u05E4\u05D9\u05E7 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05DC\u05D0\u05D1\u05D7\u05D5\u05DF \u05DE\u05DC\u05D0",
      meaningTitle: "\u05DE\u05D4 \u05D7\u05E1\u05E8 \u05DB\u05D3\u05D9 \u05DC\u05D3\u05D9\u05D9\u05E7",
      meaningBody: "\u05D4\u05DE\u05E2\u05E8\u05DB\u05EA \u05DC\u05D0 \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05E0\u05D7\u05E9. \u05DB\u05D3\u05D9 \u05DC\u05EA\u05EA \u05D3\u05D5\u05D7 \u05D0\u05DE\u05D9\u05DF \u05E6\u05E8\u05D9\u05DA \u05E2\u05D5\u05D3 \u05E7\u05D1\u05E6\u05D9\u05DD \u05D0\u05D5 \u05E7\u05D1\u05E6\u05D9\u05DD \u05D1\u05E8\u05D5\u05E8\u05D9\u05DD \u05D9\u05D5\u05EA\u05E8.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D4\u05E2\u05DC\u05D5\u05EA \u05E2\u05DB\u05E9\u05D9\u05D5",
      controlTitle: "\u05DE\u05D4 \u05DB\u05DF \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D1\u05D3\u05D5\u05E7",
      detailsTitle: "\u05DE\u05D4 \u05D4\u05E6\u05DC\u05D7\u05E0\u05D5 \u05DC\u05E7\u05E8\u05D5\u05D0",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DC\u05D0 \u05E1\u05D5\u05D5\u05D2\u05D5",
      auditTrailTitle: "\u05DC\u05DE\u05D4 \u05D4\u05D3\u05D5\u05D7 \u05D7\u05DC\u05E7\u05D9"
    },
    recommendedSections: [
      "work_done",
      "bottom_line",
      "meaning",
      "check_first",
      "export"
    ],
    primaryActions: [
      {
        title: "\u05DC\u05D4\u05E2\u05DC\u05D5\u05EA \u05E2\u05D5\u05F4\u05E9 \u05D5\u05D0\u05E9\u05E8\u05D0\u05D9 \u05E9\u05DC 3 \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD",
        whyFirst: "\u05D6\u05D4 \u05D4\u05D1\u05E1\u05D9\u05E1 \u05DC\u05D3\u05D5\u05D7 \u05D0\u05DE\u05D9\u05DF.",
        whatToDo: "\u05D4\u05E2\u05DC\u05D5 \u05E7\u05D1\u05E6\u05D9 Excel \u05DE\u05DC\u05D0\u05D9\u05DD \u05D5\u05DC\u05D0 \u05E6\u05D9\u05DC\u05D5\u05DE\u05D9 \u05DE\u05E1\u05DA.",
        amountType: "no_amount"
      }
    ],
    allowedClaims: ["\u05D7\u05E1\u05E8 \u05DE\u05D9\u05D3\u05E2", "\u05DC\u05D0 \u05E0\u05E0\u05D7\u05E9"],
    forbiddenClaims: ["\u05D7\u05D5\u05E1\u05E8", "\u05E2\u05D5\u05D3\u05E3", "\u05E4\u05D5\u05D8\u05E0\u05E6\u05D9\u05D0\u05DC \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["everything until enough data"]
    },
    evidenceRules: ["Do not create findings without readable rows."],
    claudeCopyHints: {
      tone: "helpful, not apologetic",
      doSay: ["\u05DB\u05D3\u05D9 \u05DC\u05D3\u05D9\u05D9\u05E7 \u05E6\u05E8\u05D9\u05DA \u05E2\u05D5\u05D3 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD"],
      doNotSay: ["\u05D4\u05D3\u05D5\u05D7 \u05E0\u05DB\u05E9\u05DC", "\u05D4\u05DE\u05E6\u05D1 \u05DC\u05D0 \u05D1\u05E8\u05D5\u05E8 \u05D1\u05D2\u05DC\u05DC\u05DB\u05DD"]
    }
  },
  // 4
  stable_healthy: {
    id: "stable_healthy",
    kind: "primary_diagnosis",
    priority: 100,
    label: "\u05D4\u05DE\u05E6\u05D1 \u05EA\u05E7\u05D9\u05DF \u2014 \u05D9\u05E9 \u05DE\u05E7\u05D5\u05DD \u05DC\u05E9\u05D9\u05E4\u05D5\u05E8",
    healthTone: "green",
    trigger: {
      description: "Stable income covers expenses and no major risk signals.",
      test: (f) => f.reportType === "full" && !f.hasMaterialVariableIncome && f.fixedOnlyGap > 0 && f.debtMonthlyPaymentTotal < f.fixedMonthlyIncome * 0.15
    },
    userFear: "\u05D9\u05E9 \u05D4\u05DB\u05E0\u05E1\u05D4, \u05D0\u05D1\u05DC \u05D0\u05D5\u05DC\u05D9 \u05D0\u05E0\u05D7\u05E0\u05D5 \u05DE\u05E4\u05E1\u05E4\u05E1\u05D9\u05DD \u05DE\u05E9\u05D4\u05D5.",
    mainAha: "\u05D4\u05DE\u05E6\u05D1 \u05D4\u05D1\u05E1\u05D9\u05E1\u05D9 \u05EA\u05E7\u05D9\u05DF. \u05D4\u05E9\u05D9\u05E4\u05D5\u05E8 \u05E0\u05DE\u05E6\u05D0 \u05D1\u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05D2\u05DE\u05D9\u05E9\u05D9\u05DD \u05D5\u05D1\u05E1\u05D3\u05E8.",
    ui: {
      bottomLineHeadline: "\u05D4\u05DE\u05E6\u05D1 \u05D4\u05D1\u05E1\u05D9\u05E1\u05D9 \u05EA\u05E7\u05D9\u05DF \u2014 \u05D9\u05E9 \u05DE\u05E7\u05D5\u05DD \u05DC\u05E9\u05D9\u05E4\u05D5\u05E8",
      meaningTitle: "\u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC",
      meaningBody: "\u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D4\u05E7\u05D1\u05D5\u05E2\u05D4 \u05DE\u05DB\u05E1\u05D4 \u05D0\u05EA \u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E9\u05E0\u05E6\u05E4\u05D5. \u05E2\u05DB\u05E9\u05D9\u05D5 \u05DB\u05D3\u05D0\u05D9 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05D2\u05DE\u05D9\u05E9\u05D9\u05DD, \u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05D5\u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05E9\u05DE\u05D8\u05E9\u05D8\u05E9\u05D5\u05EA \u05D0\u05EA \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D9\u05E9 \u05DC\u05DB\u05DD \u05E9\u05DC\u05D9\u05D8\u05D4",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05DC\u05E4\u05D9 \u05EA\u05D7\u05D5\u05DE\u05D9\u05DD",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "\u05DC\u05D1\u05D3\u05D5\u05E7 \u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05D2\u05DE\u05D9\u05E9\u05D9\u05DD \u05DC\u05E4\u05E0\u05D9 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05D9\u05D5\u05EA",
        whyFirst: "\u05D4\u05D1\u05E1\u05D9\u05E1 \u05E0\u05E8\u05D0\u05D4 \u05D9\u05E6\u05D9\u05D1, \u05D5\u05DC\u05DB\u05DF \u05D4\u05E9\u05D9\u05E4\u05D5\u05E8 \u05E0\u05DE\u05E6\u05D0 \u05D1\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05D9\u05E9 \u05DC\u05DB\u05DD \u05E9\u05DC\u05D9\u05D8\u05D4 \u05E2\u05DC\u05D9\u05D4\u05DD.",
        whatToDo: "\u05E2\u05D1\u05E8\u05D5 \u05E2\u05DC Wolt, \u05DE\u05E1\u05E2\u05D3\u05D5\u05EA, \u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05D5\u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05E7\u05D8\u05E0\u05D5\u05EA.",
        amountType: "review_amount",
        shouldShowAmountFrom: "none"
      }
    ],
    allowedClaims: ["\u05D4\u05DE\u05E6\u05D1 \u05EA\u05E7\u05D9\u05DF", "\u05D9\u05E9 \u05DE\u05E7\u05D5\u05DD \u05DC\u05E9\u05D9\u05E4\u05D5\u05E8"],
    forbiddenClaims: ["\u05D7\u05D5\u05E1\u05E8", "\u05DE\u05E1\u05D5\u05DB\u05DF", "\u05D3\u05D5\u05E8\u05E9 \u05D8\u05D9\u05E4\u05D5\u05DC"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["small transactions", "utilities", "known merchants"]
    },
    evidenceRules: ["Show evidence for each review category."],
    claudeCopyHints: {
      tone: "encouraging and practical",
      doSay: ["\u05D9\u05E9 \u05D1\u05E1\u05D9\u05E1 \u05D8\u05D5\u05D1", "\u05DB\u05D3\u05D0\u05D9 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05D0\u05D9\u05E4\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D9\u05D9\u05E2\u05DC"],
      doNotSay: ["\u05D0\u05EA\u05DD \u05DE\u05D1\u05D6\u05D1\u05D6\u05D9\u05DD", "\u05E6\u05E8\u05D9\u05DA \u05DC\u05E7\u05E6\u05E5"]
    }
  },
  // 5
  surplus_not_felt: {
    id: "surplus_not_felt",
    kind: "primary_diagnosis",
    priority: 200,
    label: "\u05E2\u05D5\u05D3\u05E3 \u05DE\u05D7\u05D5\u05E9\u05D1 \u05E9\u05DC\u05D0 \u05DE\u05D5\u05E8\u05D2\u05E9",
    healthTone: "yellow",
    trigger: {
      description: "Income exceeds expenses but user may not feel surplus.",
      test: (f) => f.reportType === "full" && !f.hasMaterialVariableIncome && f.fixedOnlyGap > Math.max(1500, f.fixedMonthlyIncome * 0.05)
    },
    userFear: "\u05E2\u05DC \u05D4\u05E0\u05D9\u05D9\u05E8 \u05D9\u05E9 \u05DB\u05E1\u05E3, \u05D0\u05D1\u05DC \u05D1\u05E4\u05D5\u05E2\u05DC \u05DC\u05D0 \u05DE\u05E8\u05D2\u05D9\u05E9\u05D9\u05DD \u05D0\u05D5\u05EA\u05D5.",
    mainAha: "\u05D9\u05E9 \u05E2\u05D5\u05D3\u05E3 \u05DE\u05D7\u05D5\u05E9\u05D1. \u05E2\u05DB\u05E9\u05D9\u05D5 \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D1\u05D9\u05DF \u05D0\u05DD \u05D4\u05D5\u05D0 \u05D1\u05D0\u05DE\u05EA \u05E0\u05E9\u05D0\u05E8.",
    ui: {
      bottomLineHeadline: "\u05D9\u05E9 \u05E2\u05D5\u05D3\u05E3 \u05DE\u05D7\u05D5\u05E9\u05D1 \u2014 \u05E2\u05DB\u05E9\u05D9\u05D5 \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D1\u05D9\u05DF \u05D0\u05DD \u05D4\u05D5\u05D0 \u05D1\u05D0\u05DE\u05EA \u05E0\u05E9\u05D0\u05E8",
      meaningTitle: "\u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC",
      meaningBody: "\u05D0\u05DD \u05D1\u05E4\u05D5\u05E2\u05DC \u05DC\u05D0 \u05DE\u05E8\u05D2\u05D9\u05E9\u05D9\u05DD \u05E2\u05D5\u05D3\u05E3 \u05DB\u05D6\u05D4, \u05E6\u05E8\u05D9\u05DA \u05DC\u05D1\u05D3\u05D5\u05E7 \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF, \u05D4\u05E2\u05D1\u05E8\u05D5\u05EA, \u05D7\u05E9\u05D1\u05D5\u05E0\u05D5\u05EA \u05E0\u05D5\u05E1\u05E4\u05D9\u05DD, \u05DE\u05D6\u05D5\u05DE\u05DF \u05D0\u05D5 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E9\u05DC\u05D0 \u05D4\u05D5\u05E4\u05D9\u05E2\u05D5 \u05D1\u05E7\u05D1\u05E6\u05D9\u05DD.",
      checkFirstTitle: "\u05DC\u05D0\u05DF \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E9\u05D4\u05E2\u05D5\u05D3\u05E3 \u05D4\u05D5\u05DC\u05DA",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E9\u05E4\u05E8 \u05E9\u05DC\u05D9\u05D8\u05D4",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05E9\u05DE\u05E1\u05D1\u05D9\u05E8 \u05D0\u05EA \u05D4\u05E2\u05D5\u05D3\u05E3",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "\u05DC\u05D1\u05D3\u05D5\u05E7 \u05DC\u05D0\u05DF \u05D4\u05D5\u05DC\u05DA \u05D4\u05E2\u05D5\u05D3\u05E3 \u05D4\u05DE\u05D7\u05D5\u05E9\u05D1",
        whyFirst: "\u05D4\u05D3\u05D5\u05D7 \u05DE\u05E6\u05D1\u05D9\u05E2 \u05E2\u05DC \u05E2\u05D5\u05D3\u05E3, \u05D0\u05D1\u05DC \u05D9\u05D9\u05EA\u05DB\u05DF \u05E9\u05D4\u05D5\u05D0 \u05E2\u05D5\u05D1\u05E8 \u05DC\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF, \u05D7\u05E9\u05D1\u05D5\u05DF \u05D0\u05D7\u05E8 \u05D0\u05D5 \u05D4\u05D5\u05E6\u05D0\u05D4 \u05E9\u05DC\u05D0 \u05D4\u05D5\u05E4\u05D9\u05E2\u05D4.",
        whatToDo: "\u05D1\u05D3\u05E7\u05D5 \u05D4\u05E2\u05D1\u05E8\u05D5\u05EA, \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9, \u05DE\u05D6\u05D5\u05DE\u05DF \u05D5\u05D7\u05E9\u05D1\u05D5\u05E0\u05D5\u05EA \u05E0\u05D5\u05E1\u05E4\u05D9\u05DD.",
        amountType: "review_amount"
      }
    ],
    allowedClaims: ["\u05E2\u05D5\u05D3\u05E3 \u05DE\u05D7\u05D5\u05E9\u05D1", "\u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D1\u05D9\u05DF \u05D0\u05DD \u05D4\u05D5\u05D0 \u05E0\u05E9\u05D0\u05E8"],
    forbiddenClaims: ["\u05E4\u05E2\u05E8", "\u05D7\u05D5\u05E1\u05E8", "\u05DE\u05D9\u05E0\u05D5\u05E1", "\u05D0\u05D3\u05D5\u05DD"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["possible internal transfer", "missing account context"],
      neverBlockFor: ["known utilities", "small vendors"]
    },
    evidenceRules: ["Show surplus as positive and calm."],
    claudeCopyHints: {
      tone: "curious, not alarmist",
      doSay: ["\u05E2\u05D5\u05D3\u05E3 \u05DE\u05D7\u05D5\u05E9\u05D1", "\u05DC\u05DE\u05D4 \u05D4\u05D5\u05D0 \u05DC\u05D0 \u05DE\u05D5\u05E8\u05D2\u05E9"],
      doNotSay: ["\u05E4\u05E2\u05E8", "\u05D1\u05E2\u05D9\u05D4 \u05D7\u05DE\u05D5\u05E8\u05D4"]
    }
  },
  // 6
  small_deficit: {
    id: "small_deficit",
    kind: "primary_diagnosis",
    priority: 250,
    label: "\u05D7\u05D5\u05E1\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9 \u05E7\u05D8\u05DF",
    healthTone: "yellow",
    trigger: {
      description: "Expenses exceed fixed income by a small amount.",
      test: (f) => f.reportType === "full" && !f.hasMaterialVariableIncome && f.fixedOnlyGap < 0 && Math.abs(f.fixedOnlyGap) <= Math.max(2500, f.fixedMonthlyIncome * 0.1)
    },
    userFear: "\u05D0\u05E0\u05D7\u05E0\u05D5 \u05E7\u05E6\u05EA \u05D1\u05DE\u05D9\u05E0\u05D5\u05E1 \u05D5\u05DC\u05D0 \u05D1\u05E8\u05D5\u05E8 \u05DC\u05DE\u05D4.",
    mainAha: "\u05D9\u05E9 \u05D7\u05D5\u05E1\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9 \u05E7\u05D8\u05DF. \u05DB\u05E0\u05E8\u05D0\u05D4 \u05E9\u05D4\u05D5\u05D0 \u05DE\u05D2\u05D9\u05E2 \u05DE\u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05D2\u05DE\u05D9\u05E9\u05D9\u05DD \u05D0\u05D5 \u05EA\u05E0\u05D5\u05E2\u05D5\u05EA \u05DC\u05D0 \u05DE\u05E1\u05D5\u05D5\u05D2\u05D5\u05EA.",
    ui: {
      bottomLineHeadline: "\u05D9\u05E9 \u05D7\u05D5\u05E1\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9 \u05E7\u05D8\u05DF \u2014 \u05DB\u05D3\u05D0\u05D9 \u05DC\u05D4\u05D1\u05D9\u05DF \u05DE\u05D4 \u05D9\u05D5\u05E6\u05E8 \u05D0\u05D5\u05EA\u05D5",
      meaningTitle: "\u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC",
      meaningBody: "\u05D4\u05D7\u05D5\u05E1\u05E8 \u05DC\u05D0 \u05D1\u05D4\u05DB\u05E8\u05D7 \u05D3\u05D5\u05E8\u05E9 \u05E9\u05D9\u05E0\u05D5\u05D9 \u05D3\u05E8\u05DE\u05D8\u05D9. \u05E7\u05D5\u05D3\u05DD \u05DE\u05D6\u05D4\u05D9\u05DD \u05D0\u05EA \u05D4\u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05D4\u05D2\u05DE\u05D9\u05E9\u05D9\u05DD \u05D5\u05D4\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05D3\u05D5\u05E8\u05E9\u05D9\u05DD \u05E1\u05D9\u05D5\u05D5\u05D2.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D9\u05E9 \u05DC\u05DB\u05DD \u05E9\u05DC\u05D9\u05D8\u05D4",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05DC\u05E4\u05D9 \u05EA\u05D7\u05D5\u05DE\u05D9\u05DD",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "\u05DC\u05DE\u05E6\u05D5\u05D0 \u05D0\u05EA \u05D4\u05E1\u05E2\u05D9\u05E3 \u05D4\u05D2\u05DE\u05D9\u05E9 \u05E9\u05DE\u05E1\u05D1\u05D9\u05E8 \u05D0\u05EA \u05D4\u05D7\u05D5\u05E1\u05E8",
        whyFirst: "\u05D7\u05D5\u05E1\u05E8 \u05E7\u05D8\u05DF \u05DC\u05E8\u05D5\u05D1 \u05E0\u05E4\u05EA\u05E8 \u05D3\u05E8\u05DA \u05E9\u05DC\u05D9\u05D8\u05D4 \u05D1\u05E1\u05E2\u05D9\u05E3 \u05D0\u05D7\u05D3 \u05D0\u05D5 \u05E9\u05E0\u05D9\u05D9\u05DD, \u05DC\u05D0 \u05D3\u05E8\u05DA \u05E7\u05D9\u05E6\u05D5\u05E5 \u05DB\u05DC\u05DC\u05D9.",
        whatToDo: "\u05D1\u05D3\u05E7\u05D5 Wolt, \u05DE\u05E1\u05E2\u05D3\u05D5\u05EA, \u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05D5\u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05DC\u05D0 \u05DE\u05E1\u05D5\u05D5\u05D2\u05D5\u05EA.",
        amountType: "review_amount"
      }
    ],
    allowedClaims: ["\u05D7\u05D5\u05E1\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9 \u05E7\u05D8\u05DF", "\u05DB\u05D3\u05D0\u05D9 \u05DC\u05D1\u05D3\u05D5\u05E7"],
    forbiddenClaims: ["\u05D7\u05DE\u05D5\u05E8", "\u05DE\u05E1\u05D5\u05DB\u05DF", "\u05D3\u05D5\u05E8\u05E9 \u05D8\u05D9\u05E4\u05D5\u05DC \u05DE\u05D9\u05D9\u05D3\u05D9"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["large recurring check", "possible missing income"],
      neverBlockFor: ["one-time small expenses"]
    },
    evidenceRules: ["Rank findings by impact, not by easy blame."],
    claudeCopyHints: {
      tone: "practical",
      doSay: ["\u05DB\u05D3\u05D0\u05D9 \u05DC\u05D1\u05D3\u05D5\u05E7", "\u05D0\u05E4\u05E9\u05E8 \u05DC\u05D4\u05EA\u05D7\u05D9\u05DC \u05DE\u05E1\u05E2\u05D9\u05E3 \u05D0\u05D7\u05D3"],
      doNotSay: ["\u05D0\u05EA\u05DD \u05D7\u05D9\u05D9\u05D1\u05D9\u05DD \u05DC\u05E7\u05E6\u05E5"]
    }
  },
  // 7
  large_deficit: {
    id: "large_deficit",
    kind: "primary_diagnosis",
    priority: 300,
    label: "\u05D7\u05D5\u05E1\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9 \u05DE\u05E9\u05DE\u05E2\u05D5\u05EA\u05D9",
    healthTone: "orange",
    trigger: {
      description: "Expenses exceed income materially.",
      test: (f) => f.reportType === "full" && !f.hasMaterialVariableIncome && f.fixedOnlyGap < 0 && Math.abs(f.fixedOnlyGap) > Math.max(2500, f.fixedMonthlyIncome * 0.1)
    },
    userFear: "\u05D9\u05E9 \u05D7\u05D5\u05E1\u05E8 \u05D2\u05D3\u05D5\u05DC, \u05D0\u05D1\u05DC \u05D0\u05E0\u05D9 \u05DC\u05D0 \u05E8\u05D5\u05E6\u05D4 \u05D3\u05D5\u05D7 \u05DE\u05E4\u05D7\u05D9\u05D3.",
    mainAha: "\u05D9\u05E9 \u05D7\u05D5\u05E1\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9 \u05DE\u05E9\u05DE\u05E2\u05D5\u05EA\u05D9. \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D1\u05D9\u05DF \u05E7\u05D5\u05D3\u05DD \u05DE\u05D4 \u05D9\u05D5\u05E6\u05E8 \u05D0\u05D5\u05EA\u05D5.",
    ui: {
      bottomLineHeadline: "\u05D9\u05E9 \u05D7\u05D5\u05E1\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9 \u05DE\u05E9\u05DE\u05E2\u05D5\u05EA\u05D9 \u2014 \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D1\u05D9\u05DF \u05DE\u05D4 \u05D9\u05D5\u05E6\u05E8 \u05D0\u05D5\u05EA\u05D5",
      meaningTitle: "\u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC",
      meaningBody: "\u05DC\u05E4\u05E0\u05D9 \u05E9\u05E0\u05D5\u05D2\u05E2\u05D9\u05DD \u05D1\u05DB\u05DC \u05E1\u05E2\u05D9\u05E3 \u05E7\u05D8\u05DF, \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05E4\u05E8\u05D9\u05D3 \u05D1\u05D9\u05DF \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05D9\u05D5\u05EA, \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E7\u05D1\u05D5\u05E2\u05D5\u05EA \u05D5\u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05D2\u05DE\u05D9\u05E9\u05D9\u05DD \u05D2\u05D3\u05D5\u05DC\u05D9\u05DD.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D9\u05E9 \u05E9\u05DC\u05D9\u05D8\u05D4",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05DE\u05E7\u05D5\u05E8\u05D5\u05EA \u05D4\u05D7\u05D5\u05E1\u05E8",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "\u05DC\u05D4\u05E4\u05E8\u05D9\u05D3 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05D9\u05D5\u05EA \u05DE\u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05D2\u05DE\u05D9\u05E9\u05D9\u05DD",
        whyFirst: "\u05DC\u05D0 \u05DB\u05DC \u05D4\u05D5\u05E6\u05D0\u05D4 \u05D4\u05D9\u05D0 \u05DE\u05E7\u05D5\u05DD \u05DC\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF. \u05D3\u05D9\u05D5\u05E8, \u05D4\u05DC\u05D5\u05D5\u05D0\u05D5\u05EA \u05D5\u05D7\u05E9\u05D1\u05D5\u05E0\u05D5\u05EA \u05D4\u05DD \u05D1\u05E1\u05D9\u05E1; Wolt \u05D5\u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05D4\u05DD \u05E9\u05DC\u05D9\u05D8\u05D4.",
        whatToDo: "\u05D1\u05D3\u05E7\u05D5 \u05E7\u05D5\u05D3\u05DD fixed commitments, \u05D0\u05D7\u05E8 \u05DB\u05DA Wolt/\u05DE\u05E1\u05E2\u05D3\u05D5\u05EA \u05D5\u05DE\u05E0\u05D5\u05D9\u05D9\u05DD.",
        amountType: "review_amount"
      }
    ],
    allowedClaims: ["\u05D7\u05D5\u05E1\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9", "\u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D1\u05D9\u05DF \u05DE\u05D4 \u05D9\u05D5\u05E6\u05E8 \u05D0\u05D5\u05EA\u05D5"],
    forbiddenClaims: ["\u05D7\u05DE\u05D5\u05E8", "\u05DE\u05E1\u05D5\u05DB\u05DF", "\u05E7\u05D7\u05D5 \u05D4\u05DC\u05D5\u05D5\u05D0\u05D4"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: [
        "missing income",
        "large unclear transaction",
        "large recurring payment"
      ],
      neverBlockFor: ["small vendor charge"]
    },
    evidenceRules: [
      "Never start with tiny subscriptions if housing/debt dominates."
    ],
    claudeCopyHints: {
      tone: "direct but calm",
      doSay: ["\u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D1\u05D9\u05DF \u05DE\u05D4 \u05D9\u05D5\u05E6\u05E8 \u05D0\u05D5\u05EA\u05D5"],
      doNotSay: ["\u05D4\u05DE\u05E6\u05D1 \u05D7\u05DE\u05D5\u05E8", "\u05D7\u05D9\u05D9\u05D1\u05D9\u05DD"]
    }
  },
  // 8
  variable_income_dependent: {
    id: "variable_income_dependent",
    kind: "primary_diagnosis",
    priority: 500,
    label: "\u05D4\u05EA\u05DE\u05D5\u05E0\u05D4 \u05EA\u05DC\u05D5\u05D9\u05D4 \u05D1\u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05E9\u05EA\u05E0\u05D4",
    healthTone: "yellow",
    trigger: {
      description: "Material variable income changes the financial picture.",
      test: (f) => f.reportType === "full" && f.hasMaterialVariableIncome && (f.variableIncomeMonthlyAvg > f.fixedMonthlyIncome * 0.1 || Math.sign(f.fixedOnlyGap) !== Math.sign(f.withVariableGap) || f.fixedOnlyGap < 0)
    },
    userFear: "\u05D0\u05D9 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D4\u05D1\u05D9\u05DF \u05D0\u05EA \u05D4\u05DE\u05E6\u05D1 \u05DB\u05D9 \u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05DC\u05D0 \u05E7\u05D1\u05D5\u05E2\u05D4.",
    mainAha: "\u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D4\u05DE\u05E9\u05EA\u05E0\u05D4 \u05D4\u05D9\u05D0 \u05DE\u05D4 \u05E9\u05DE\u05D7\u05D6\u05D9\u05E7 \u05D0\u05EA \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4.",
    ui: {
      bottomLineHeadline: "\u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D4\u05E7\u05D1\u05D5\u05E2\u05D4 \u05DC\u05D1\u05D3 \u05DC\u05D0 \u05DE\u05DB\u05E1\u05D4 \u05D0\u05EA \u05E8\u05DE\u05EA \u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E9\u05E0\u05E6\u05E4\u05EA\u05D4",
      meaningTitle: "\u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC",
      meaningBody: "\u05D1\u05D7\u05D5\u05D3\u05E9\u05D9\u05DD \u05E9\u05D1\u05D4\u05DD \u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D4\u05DE\u05E9\u05EA\u05E0\u05D4 \u05DC\u05D0 \u05E0\u05DB\u05E0\u05E1\u05EA, \u05E8\u05DE\u05EA \u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05DC\u05D0 \u05DE\u05EA\u05DB\u05E0\u05E1\u05EA. \u05D1\u05D7\u05D5\u05D3\u05E9\u05D9\u05DD \u05E9\u05D1\u05D4\u05DD \u05D4\u05D9\u05D0 \u05E0\u05DB\u05E0\u05E1\u05EA \u05D2\u05D1\u05D5\u05D4, \u05D0\u05EA\u05DD \u05DE\u05EA\u05E7\u05E8\u05D1\u05D9\u05DD \u05DC\u05D0\u05D9\u05D6\u05D5\u05DF.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D9\u05E9 \u05DC\u05DB\u05DD \u05E9\u05DC\u05D9\u05D8\u05D4",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05DC\u05E4\u05D9 \u05EA\u05D7\u05D5\u05DE\u05D9\u05DD",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "\u05DC\u05D4\u05D2\u05D3\u05D9\u05E8 \u05D1\u05E1\u05D9\u05E1 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05D7\u05D5\u05D3\u05E9\u05D9 \u05E9\u05D0\u05E4\u05E9\u05E8 \u05DC\u05E1\u05DE\u05D5\u05DA \u05E2\u05DC\u05D9\u05D5",
        whyFirst: "\u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D4\u05DE\u05E9\u05EA\u05E0\u05D4 \u05DE\u05E9\u05E0\u05D4 \u05D0\u05EA \u05DB\u05DC \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4.",
        whatToDo: "\u05D4\u05D2\u05D3\u05D9\u05E8\u05D5 \u05DE\u05D4 \u05D4\u05E1\u05DB\u05D5\u05DD \u05D4\u05DE\u05D9\u05E0\u05D9\u05DE\u05DC\u05D9 \u05E9\u05E6\u05E4\u05D5\u05D9 \u05DC\u05D4\u05D9\u05DB\u05E0\u05E1 \u05D1\u05E8\u05D5\u05D1 \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9\u05DD.",
        amountType: "no_amount"
      }
    ],
    allowedClaims: ["\u05EA\u05DC\u05D5\u05D9 \u05D1\u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05E9\u05EA\u05E0\u05D4", "\u05E6\u05E8\u05D9\u05DA \u05E9\u05E0\u05D9 \u05EA\u05E8\u05D7\u05D9\u05E9\u05D9\u05DD"],
    forbiddenClaims: ["\u05DE\u05E1\u05E4\u05E8 \u05D0\u05D7\u05D3 \u05DE\u05D5\u05D7\u05DC\u05D8", "\u20AAX/\u05D7\u05D5\u05D3\u05E9 \u05DC\u05D4\u05DB\u05E0\u05E1\u05D4 \u05DC\u05D0 \u05E7\u05D1\u05D5\u05E2\u05D4"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["partner/business income classification"],
      neverBlockFor: ["utilities", "medical one-time", "small vendors"]
    },
    evidenceRules: [
      "Show fixed-only scenario.",
      "Show with-variable scenario.",
      "Never combine variable income into fixed income."
    ],
    claudeCopyHints: {
      tone: "clear and reassuring",
      doSay: ["\u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D4\u05DE\u05E9\u05EA\u05E0\u05D4 \u05D4\u05D9\u05D0 \u05DE\u05D4 \u05E9\u05DE\u05D7\u05D6\u05D9\u05E7 \u05D0\u05EA \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4", "\u05E9\u05E0\u05D9 \u05EA\u05E8\u05D7\u05D9\u05E9\u05D9\u05DD"],
      doNotSay: ["\u05D4\u05DB\u05E0\u05E1\u05D4 \u05E7\u05D1\u05D5\u05E2\u05D4", "\u05E4\u05E2\u05E8 \u05D0\u05D7\u05D3 \u05E1\u05D5\u05E4\u05D9"]
    }
  },
  // 9
  missing_income: {
    id: "missing_income",
    kind: "primary_diagnosis",
    priority: 480,
    label: "\u05D9\u05D9\u05EA\u05DB\u05DF \u05E9\u05D7\u05E1\u05E8\u05D4 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05D1\u05EA\u05DE\u05D5\u05E0\u05D4",
    healthTone: "yellow",
    trigger: {
      description: "Observed expenses suggest income source may be missing.",
      test: (f) => f.reportType === "full" && f.missingIncomeLikely && f.fixedOnlyGap < 0
    },
    userFear: "\u05D4\u05D3\u05D5\u05D7 \u05D0\u05D5\u05DE\u05E8 \u05D7\u05D5\u05E1\u05E8 \u05D0\u05D1\u05DC \u05D0\u05D5\u05DC\u05D9 \u05D7\u05E1\u05E8 \u05D7\u05E9\u05D1\u05D5\u05DF \u05D0\u05D5 \u05DE\u05E7\u05D5\u05E8 \u05D4\u05DB\u05E0\u05E1\u05D4.",
    mainAha: "\u05D9\u05D9\u05EA\u05DB\u05DF \u05E9\u05D4\u05EA\u05DE\u05D5\u05E0\u05D4 \u05DC\u05D0 \u05DB\u05D5\u05DC\u05DC\u05EA \u05D0\u05EA \u05DB\u05DC \u05D4\u05D4\u05DB\u05E0\u05E1\u05D5\u05EA.",
    ui: {
      bottomLineHeadline: "\u05D9\u05D9\u05EA\u05DB\u05DF \u05E9\u05D7\u05E1\u05E8\u05D4 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05D1\u05EA\u05DE\u05D5\u05E0\u05D4",
      meaningTitle: "\u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC",
      meaningBody: "\u05D0\u05DD \u05D9\u05E9 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05E0\u05D5\u05E1\u05E4\u05EA, \u05D7\u05E9\u05D1\u05D5\u05DF \u05E0\u05D5\u05E1\u05E3 \u05D0\u05D5 \u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05E9\u05DC\u05D0 \u05D4\u05D5\u05E2\u05DC\u05D5, \u05D4\u05D7\u05D9\u05E9\u05D5\u05D1 \u05DE\u05E9\u05EA\u05E0\u05D4.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05DE\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E9\u05E4\u05E8 \u05D0\u05D7\u05E8\u05D9 \u05D4\u05E9\u05DC\u05DE\u05EA \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4",
      detailsTitle: "\u05DE\u05D4 \u05D4\u05D3\u05D5\u05D7 \u05DB\u05DF \u05E8\u05D5\u05D0\u05D4",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "\u05DC\u05D5\u05D5\u05D3\u05D0 \u05E9\u05DB\u05DC \u05DE\u05E7\u05D5\u05E8\u05D5\u05EA \u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05D5\u05E4\u05D9\u05E2\u05D9\u05DD",
        whyFirst: "\u05D1\u05DC\u05D9 \u05EA\u05DE\u05D5\u05E0\u05EA \u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05DC\u05D0\u05D4 \u05D0\u05D9 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D4\u05D1\u05D9\u05DF \u05D0\u05DD \u05D9\u05E9 \u05D7\u05D5\u05E1\u05E8 \u05D0\u05DE\u05D9\u05EA\u05D9.",
        whatToDo: "\u05D1\u05D3\u05E7\u05D5 \u05D7\u05E9\u05D1\u05D5\u05DF \u05E0\u05D5\u05E1\u05E3, \u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05D1\u05DF/\u05D1\u05EA \u05D6\u05D5\u05D2, \u05E2\u05E1\u05E7, \u05E7\u05E6\u05D1\u05D0\u05D5\u05EA \u05D0\u05D5 \u05D4\u05D7\u05D6\u05E8\u05D9\u05DD.",
        amountType: "no_amount"
      }
    ],
    allowedClaims: ["\u05D9\u05D9\u05EA\u05DB\u05DF \u05E9\u05D7\u05E1\u05E8\u05D4 \u05D4\u05DB\u05E0\u05E1\u05D4", "\u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05E9\u05DC\u05D9\u05DD \u05EA\u05DE\u05D5\u05E0\u05D4"],
    forbiddenClaims: ["\u05D7\u05D5\u05E1\u05E8 \u05D5\u05D3\u05D0\u05D9", "\u05E7\u05D9\u05E6\u05D5\u05E5 \u05DE\u05D9\u05D9\u05D3\u05D9"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["possible missing income"],
      neverBlockFor: ["small expenses"]
    },
    evidenceRules: ["Show what data exists and what may be missing."],
    claudeCopyHints: {
      tone: "investigative",
      doSay: ["\u05D9\u05D9\u05EA\u05DB\u05DF \u05E9\u05D7\u05E1\u05E8\u05D4 \u05D4\u05DB\u05E0\u05E1\u05D4"],
      doNotSay: ["\u05D4\u05DE\u05E1\u05E4\u05E8\u05D9\u05DD \u05DC\u05D0 \u05DE\u05E1\u05EA\u05D3\u05E8\u05D9\u05DD"]
    }
  },
  // 10
  one_time_income_distortion: {
    id: "one_time_income_distortion",
    kind: "primary_diagnosis",
    priority: 470,
    label: "\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05EA \u05DE\u05E2\u05D5\u05D5\u05EA\u05EA \u05D0\u05EA \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4",
    healthTone: "yellow",
    trigger: {
      description: "Large one-time income was detected/excluded.",
      test: (f) => f.oneTimeIncomeExcludedTotal > Math.max(5e3, f.fixedMonthlyIncome * 0.2)
    },
    userFear: "\u05E0\u05DB\u05E0\u05E1 \u05E1\u05DB\u05D5\u05DD \u05D2\u05D3\u05D5\u05DC, \u05D0\u05D1\u05DC \u05D6\u05D4 \u05DC\u05D0 \u05D0\u05D5\u05DE\u05E8 \u05E9\u05D4\u05D7\u05D5\u05D3\u05E9 \u05E8\u05D2\u05D9\u05DC.",
    mainAha: "\u05D9\u05E9 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05EA \u05E9\u05D0\u05E1\u05D5\u05E8 \u05DC\u05D7\u05E9\u05D1 \u05DB\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D7\u05D5\u05D3\u05E9\u05D9\u05EA.",
    ui: {
      bottomLineHeadline: "\u05D9\u05E9 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05EA \u05E9\u05DC\u05D0 \u05E0\u05E1\u05E4\u05E8\u05D4 \u05DB\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D7\u05D5\u05D3\u05E9\u05D9\u05EA",
      meaningTitle: "\u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC",
      meaningBody: "\u05E1\u05DB\u05D5\u05DD \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9 \u05DB\u05DE\u05D5 \u05E7\u05E8\u05DF \u05D4\u05E9\u05EA\u05DC\u05DE\u05D5\u05EA \u05D9\u05DB\u05D5\u05DC \u05DC\u05DB\u05E1\u05D5\u05EA \u05D7\u05D5\u05D1\u05D5\u05EA \u05D0\u05D5 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA, \u05D0\u05D1\u05DC \u05D4\u05D5\u05D0 \u05DC\u05D0 \u05DE\u05D9\u05D9\u05E6\u05D2 \u05D7\u05D5\u05D3\u05E9 \u05E8\u05D2\u05D9\u05DC.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D9\u05E9 \u05E9\u05DC\u05D9\u05D8\u05D4 \u05D0\u05D7\u05E8\u05D9 \u05D4\u05D4\u05D7\u05E8\u05D2\u05D4",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05DB\u05E0\u05E1\u05D5\u05EA \u05D5\u05D4\u05D7\u05E8\u05D2\u05D5\u05EA",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "\u05DC\u05D4\u05D1\u05D9\u05DF \u05DC\u05D0\u05DF \u05D4\u05DC\u05DA \u05D4\u05E1\u05DB\u05D5\u05DD \u05D4\u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9",
        whyFirst: "\u05D0\u05DD \u05D4\u05E1\u05DB\u05D5\u05DD \u05DB\u05D9\u05E1\u05D4 \u05D7\u05D5\u05D1 \u05D0\u05D5 \u05D4\u05D5\u05E6\u05D0\u05D4 \u05D2\u05D3\u05D5\u05DC\u05D4, \u05D4\u05D5\u05D0 \u05DE\u05E1\u05D1\u05D9\u05E8 \u05D7\u05DC\u05E7 \u05DE\u05D4\u05EA\u05DE\u05D5\u05E0\u05D4 \u05D0\u05D1\u05DC \u05DC\u05D0 \u05DE\u05E9\u05E0\u05D4 \u05D0\u05EA \u05D4\u05D7\u05D5\u05D3\u05E9 \u05D4\u05E8\u05D2\u05D9\u05DC.",
        whatToDo: "\u05D1\u05D3\u05E7\u05D5 \u05D4\u05D0\u05DD \u05E9\u05D9\u05DE\u05E9 \u05DC\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF, \u05DB\u05D9\u05E1\u05D5\u05D9 \u05D7\u05D5\u05D1, \u05D4\u05D5\u05E6\u05D0\u05D4 \u05D2\u05D3\u05D5\u05DC\u05D4 \u05D0\u05D5 \u05D7\u05E9\u05D1\u05D5\u05DF \u05D0\u05D7\u05E8.",
        amountType: "review_amount"
      }
    ],
    allowedClaims: ["\u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9", "\u05DC\u05D0 \u05E0\u05E1\u05E4\u05E8 \u05DB\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D7\u05D5\u05D3\u05E9\u05D9\u05EA"],
    forbiddenClaims: ["/\u05D7\u05D5\u05D3\u05E9", "\u05D4\u05DB\u05E0\u05E1\u05D4 \u05E7\u05D1\u05D5\u05E2\u05D4"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["large one-time source unclear"],
      neverBlockFor: ["small refunds"]
    },
    evidenceRules: ["Never show one-time income as monthly."],
    claudeCopyHints: {
      tone: "clarifying",
      doSay: ["\u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9", "\u05DC\u05D0 \u05E0\u05E1\u05E4\u05E8 \u05DB\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D7\u05D5\u05D3\u05E9\u05D9\u05EA"],
      doNotSay: ["\u20AAX/\u05D7\u05D5\u05D3\u05E9"]
    }
  },
  // 11
  one_time_expense_distortion: {
    id: "one_time_expense_distortion",
    kind: "primary_diagnosis",
    priority: 430,
    label: "\u05D4\u05D5\u05E6\u05D0\u05D4 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05EA \u05DE\u05E2\u05D5\u05D5\u05EA\u05EA \u05D0\u05EA \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4",
    healthTone: "yellow",
    trigger: {
      description: "Large one-time expense distorts monthly run-rate.",
      test: (f) => f.oneTimeExpenseTotal > Math.max(3e3, f.monthlyExpenses * 0.1)
    },
    userFear: "\u05D4\u05D7\u05D5\u05D3\u05E9 \u05E0\u05E8\u05D0\u05D4 \u05E8\u05E2 \u05D1\u05D2\u05DC\u05DC \u05DE\u05E9\u05D4\u05D5 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9.",
    mainAha: "\u05D9\u05E9 \u05D4\u05D5\u05E6\u05D0\u05D4 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05EA \u05E9\u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05E4\u05E8\u05D9\u05D3 \u05DE\u05D4\u05D4\u05EA\u05E0\u05D4\u05D2\u05D5\u05EA \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9\u05EA.",
    ui: {
      bottomLineHeadline: "\u05D9\u05E9 \u05D4\u05D5\u05E6\u05D0\u05D4 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05EA \u05E9\u05DE\u05E2\u05D5\u05D5\u05EA\u05EA \u05D0\u05EA \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4",
      meaningTitle: "\u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC",
      meaningBody: "\u05DC\u05D0 \u05E0\u05DB\u05D5\u05DF \u05DC\u05D4\u05E1\u05D9\u05E7 \u05DE\u05D4\u05D5\u05E6\u05D0\u05D4 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05EA \u05E2\u05DC \u05D4\u05E8\u05D2\u05DC \u05D7\u05D5\u05D3\u05E9\u05D9. \u05E6\u05E8\u05D9\u05DA \u05DC\u05E8\u05D0\u05D5\u05EA \u05D0\u05EA \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4 \u05E2\u05DD \u05D5\u05D1\u05DC\u05D9 \u05D4\u05D4\u05D5\u05E6\u05D0\u05D4.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E9\u05E4\u05E8 \u05D1\u05D7\u05D5\u05D3\u05E9 \u05E8\u05D2\u05D9\u05DC",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05D5\u05EA",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "\u05DC\u05D4\u05E4\u05E8\u05D9\u05D3 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9 \u05DE\u05D4\u05D7\u05D5\u05D3\u05E9 \u05D4\u05E8\u05D2\u05D9\u05DC",
        whyFirst: "\u05DB\u05DA \u05DC\u05D0 \u05DE\u05E7\u05D1\u05DC\u05D9\u05DD \u05D4\u05D7\u05DC\u05D8\u05D5\u05EA \u05E2\u05DC \u05E1\u05DE\u05DA \u05D7\u05D5\u05D3\u05E9 \u05D7\u05E8\u05D9\u05D2.",
        whatToDo: "\u05D1\u05D3\u05E7\u05D5 \u05D4\u05D0\u05DD \u05D4\u05D4\u05D5\u05E6\u05D0\u05D4 \u05EA\u05D7\u05D6\u05D5\u05E8 \u05D0\u05D5 \u05D4\u05D9\u05D9\u05EA\u05D4 \u05D0\u05D9\u05E8\u05D5\u05E2 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9.",
        amountType: "review_amount"
      }
    ],
    allowedClaims: ["\u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9", "\u05DC\u05D0 \u05D1\u05D4\u05DB\u05E8\u05D7 \u05D4\u05EA\u05E0\u05D4\u05D2\u05D5\u05EA \u05D7\u05D5\u05D3\u05E9\u05D9\u05EA"],
    forbiddenClaims: ["\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05E7\u05D1\u05D5\u05E2", "\u05E7\u05D9\u05E6\u05D5\u05E5 \u05E7\u05D1\u05D5\u05E2"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["large one-time expense unclear and material"],
      neverBlockFor: ["one-time under threshold"]
    },
    evidenceRules: ["Show with/without one-time if material."],
    claudeCopyHints: {
      tone: "careful",
      doSay: ["\u05DC\u05D0 \u05DC\u05D4\u05E1\u05D9\u05E7 \u05DE\u05D7\u05D5\u05D3\u05E9 \u05D7\u05E8\u05D9\u05D2"],
      doNotSay: ["\u05D6\u05D4 \u05EA\u05DE\u05D9\u05D3 \u05E7\u05D5\u05E8\u05D4"]
    }
  },
  // 12
  debt_pressure: {
    id: "debt_pressure",
    kind: "primary_diagnosis",
    priority: 420,
    label: "\u05E2\u05D5\u05DE\u05E1 \u05D7\u05D5\u05D1 / \u05D4\u05DC\u05D5\u05D5\u05D0\u05D4",
    healthTone: "orange",
    trigger: {
      description: "Material debt balance or monthly loan payments.",
      test: (f) => f.debtMonthlyPaymentTotal > Math.max(1200, f.fixedMonthlyIncome * 0.08) || f.debtBalanceTotal > Math.max(3e4, f.fixedMonthlyIncome)
    },
    userFear: "\u05D4\u05DC\u05D5\u05D5\u05D0\u05D4 \u05D0\u05D5 \u05D7\u05D5\u05D1 \u05D0\u05D5\u05DB\u05DC\u05D9\u05DD \u05D0\u05EA \u05D4\u05D7\u05D5\u05D3\u05E9.",
    mainAha: "\u05D9\u05E9 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA \u05E7\u05D1\u05D5\u05E2\u05D4 \u05E9\u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05DB\u05E0\u05D9\u05E1 \u05DC\u05D1\u05E1\u05D9\u05E1 \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9.",
    ui: {
      bottomLineHeadline: "\u05D9\u05E9 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA \u05D7\u05D5\u05D1 \u05E9\u05DE\u05E9\u05E4\u05D9\u05E2\u05D4 \u05E2\u05DC \u05D4\u05D1\u05E1\u05D9\u05E1 \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9",
      meaningTitle: "\u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC",
      meaningBody: "\u05D4\u05DC\u05D5\u05D5\u05D0\u05D4 \u05D4\u05D9\u05D0 \u05DC\u05D0 \u05DE\u05E7\u05D5\u05DD \u05DC\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DE\u05D9\u05D9\u05D3\u05D9. \u05D4\u05D9\u05D0 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA \u05E9\u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05DB\u05E0\u05D9\u05E1 \u05DC\u05EA\u05DE\u05D5\u05E0\u05D4 \u05DC\u05E4\u05E0\u05D9 \u05E9\u05D1\u05D5\u05D3\u05E7\u05D9\u05DD \u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05D2\u05DE\u05D9\u05E9\u05D9\u05DD.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05DB\u05DF \u05D9\u05E9 \u05E9\u05DC\u05D9\u05D8\u05D4",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05DC\u05D5\u05D5\u05D0\u05D5\u05EA \u05D5\u05D7\u05D5\u05D1",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "\u05DC\u05D4\u05D1\u05D9\u05DF \u05D0\u05EA \u05E2\u05D5\u05DE\u05E1 \u05D4\u05D4\u05D7\u05D6\u05E8 \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9",
        whyFirst: "\u05D6\u05D4 \u05D7\u05DC\u05E7 \u05DE\u05D4\u05D1\u05E1\u05D9\u05E1 \u05D4\u05E7\u05D1\u05D5\u05E2 \u05D5\u05DC\u05D0 \u05E1\u05E2\u05D9\u05E3 \u05D2\u05DE\u05D9\u05E9.",
        whatToDo: "\u05D1\u05D3\u05E7\u05D5 \u05D9\u05EA\u05E8\u05D4, \u05D4\u05D7\u05D6\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9, \u05E8\u05D9\u05D1\u05D9\u05EA \u05D5\u05EA\u05D0\u05E8\u05D9\u05DA \u05E1\u05D9\u05D5\u05DD.",
        amountType: "fixed_commitment",
        shouldShowAmountFrom: "debtMonthlyPaymentTotal"
      }
    ],
    allowedClaims: ["\u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA \u05E7\u05D1\u05D5\u05E2\u05D4", "\u05D4\u05D7\u05D6\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9"],
    forbiddenClaims: ["\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DE\u05D4\u05D4\u05DC\u05D5\u05D5\u05D0\u05D4", "\u05E7\u05D7\u05D5 \u05D4\u05DC\u05D5\u05D5\u05D0\u05D4 \u05D7\u05D3\u05E9\u05D4"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["unclear loan/debt payment"],
      neverBlockFor: ["known monthly loan with evidence"]
    },
    evidenceRules: ["Separate balance from monthly payment."],
    claudeCopyHints: {
      tone: "serious but calm",
      doSay: ["\u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA \u05E7\u05D1\u05D5\u05E2\u05D4"],
      doNotSay: ["\u05E7\u05D7\u05D5 \u05D4\u05DC\u05D5\u05D5\u05D0\u05D4", "\u05DE\u05E1\u05D5\u05DB\u05DF"]
    }
  },
  // 13
  overdraft_interest: {
    id: "overdraft_interest",
    kind: "risk_context",
    priority: 410,
    label: "\u05E8\u05D9\u05D1\u05D9\u05EA / \u05DE\u05D9\u05E0\u05D5\u05E1 \u05D7\u05D5\u05D6\u05E8",
    healthTone: "orange",
    trigger: {
      description: "Recurring overdraft or interest charges.",
      test: (f) => f.overdraftInterestMonthly > 100
    },
    userFear: "\u05DB\u05E1\u05E3 \u05D4\u05D5\u05DC\u05DA \u05DC\u05E8\u05D9\u05D1\u05D9\u05EA \u05D5\u05DC\u05D0 \u05D1\u05E8\u05D5\u05E8 \u05DB\u05DE\u05D4.",
    mainAha: "\u05D9\u05E9 \u05DB\u05E1\u05E3 \u05E9\u05D9\u05D5\u05E6\u05D0 \u05E2\u05DC \u05E8\u05D9\u05D1\u05D9\u05EA \u05D0\u05D5 \u05DE\u05D9\u05E0\u05D5\u05E1, \u05DC\u05D0 \u05E2\u05DC \u05E6\u05E8\u05D9\u05DB\u05D4.",
    ui: {
      bottomLineHeadline: "\u05D9\u05E9 \u05E8\u05D9\u05D1\u05D9\u05EA \u05D7\u05D5\u05D3\u05E9\u05D9\u05EA \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05D4\u05D1\u05D9\u05DF",
      meaningTitle: "\u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC",
      meaningBody: "\u05E8\u05D9\u05D1\u05D9\u05EA \u05E2\u05DC \u05DE\u05D9\u05E0\u05D5\u05E1 \u05D4\u05D9\u05D0 \u05DB\u05E1\u05E3 \u05E9\u05DC\u05D0 \u05E7\u05D5\u05E0\u05D4 \u05E9\u05D5\u05DD \u05D3\u05D1\u05E8. \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D1\u05D9\u05DF \u05D0\u05DD \u05D4\u05D9\u05D0 \u05D7\u05D5\u05D6\u05E8\u05EA \u05D5\u05DE\u05D4 \u05D2\u05D5\u05E8\u05DD \u05DC\u05D4.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D4\u05E4\u05D7\u05D9\u05EA \u05E2\u05DC\u05D5\u05EA",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05E8\u05D9\u05D1\u05D9\u05D5\u05EA \u05D5\u05DE\u05D9\u05E0\u05D5\u05E1",
      classifyLaterTitle: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: FINAL_REPORT_SECTION_ORDER,
    primaryActions: [
      {
        title: "\u05DC\u05D1\u05D3\u05D5\u05E7 \u05DE\u05D4 \u05D2\u05D5\u05E8\u05DD \u05DC\u05E8\u05D9\u05D1\u05D9\u05EA \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9\u05EA",
        whyFirst: "\u05D6\u05D4 \u05DB\u05E1\u05E3 \u05E9\u05D9\u05D5\u05E6\u05D0 \u05DC\u05DC\u05D0 \u05E2\u05E8\u05DA \u05E6\u05E8\u05DB\u05E0\u05D9.",
        whatToDo: "\u05D1\u05D3\u05E7\u05D5 \u05DE\u05EA\u05D9 \u05D4\u05DE\u05D9\u05E0\u05D5\u05E1 \u05E0\u05D5\u05E6\u05E8 \u05D5\u05D4\u05D0\u05DD \u05D4\u05D5\u05D0 \u05E7\u05E9\u05D5\u05E8 \u05DC\u05E4\u05E2\u05E8 \u05E9\u05D5\u05D8\u05E3.",
        amountType: "review_amount"
      }
    ],
    allowedClaims: ["\u05E8\u05D9\u05D1\u05D9\u05EA", "\u05E2\u05DC\u05D5\u05EA \u05D7\u05D5\u05D3\u05E9\u05D9\u05EA"],
    forbiddenClaims: ["\u05E7\u05D7\u05D5 \u05D4\u05DC\u05D5\u05D5\u05D0\u05D4", "\u05DE\u05E1\u05D5\u05DB\u05DF"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["known interest charge"]
    },
    evidenceRules: ["Show interest as cost, not moral failure."],
    claudeCopyHints: {
      tone: "practical",
      doSay: ["\u05DB\u05E1\u05E3 \u05E9\u05D9\u05D5\u05E6\u05D0 \u05E2\u05DC \u05E8\u05D9\u05D1\u05D9\u05EA"],
      doNotSay: ["\u05D4\u05EA\u05E0\u05D4\u05DC\u05D5\u05EA \u05D2\u05E8\u05D5\u05E2\u05D4"]
    }
  },
  // 14
  recurring_large_check: {
    id: "recurring_large_check",
    kind: "secondary_finding",
    priority: 390,
    label: "\u05E9\u05D9\u05E7 \u05D2\u05D3\u05D5\u05DC \u05E9\u05D7\u05D5\u05D6\u05E8",
    healthTone: "yellow",
    trigger: {
      description: "Large recurring check/payment exists.",
      test: (f) => f.recurringLargeChecksTotal > 1e3
    },
    userFear: "\u05E9\u05D9\u05E7\u05D9\u05DD \u05DC\u05D0 \u05D1\u05E8\u05D5\u05E8\u05D9\u05DD \u05DE\u05E0\u05E4\u05D7\u05D9\u05DD \u05D0\u05EA \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4.",
    mainAha: "\u05E9\u05D9\u05E7 \u05D7\u05D5\u05D6\u05E8 \u05D2\u05D3\u05D5\u05DC \u05D7\u05D9\u05D9\u05D1 \u05E1\u05D9\u05D5\u05D5\u05D2 \u05DB\u05D9 \u05D4\u05D5\u05D0 \u05DE\u05E9\u05E0\u05D4 \u05D0\u05EA \u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D4\u05E7\u05D1\u05D5\u05E2\u05D5\u05EA.",
    ui: {
      bottomLineHeadline: "\u05DE\u05E6\u05D0\u05E0\u05D5 \u05E9\u05D9\u05E7 \u05D7\u05D5\u05D6\u05E8 \u05D2\u05D3\u05D5\u05DC \u05E9\u05DE\u05E9\u05E4\u05D9\u05E2 \u05E2\u05DC \u05D4\u05D1\u05E1\u05D9\u05E1",
      meaningTitle: "\u05DC\u05DE\u05D4 \u05D6\u05D4 \u05DE\u05E9\u05E0\u05D4",
      meaningBody: "\u05D0\u05DD \u05D6\u05D4 \u05D3\u05D9\u05D5\u05E8 \u05D0\u05D5 \u05D7\u05D5\u05D1, \u05D6\u05D5 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA \u05E7\u05D1\u05D5\u05E2\u05D4. \u05D0\u05DD \u05D6\u05D5 \u05D4\u05E2\u05D1\u05E8\u05D4 \u05E4\u05E0\u05D9\u05DE\u05D9\u05EA, \u05DC\u05D0 \u05E0\u05E1\u05E4\u05D5\u05E8 \u05D0\u05D5\u05EA\u05D4 \u05DB\u05D4\u05D5\u05E6\u05D0\u05D4.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05DE\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E9\u05E4\u05E8 \u05D0\u05D7\u05E8\u05D9 \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05E9\u05D9\u05E7\u05D9\u05DD \u05D5\u05EA\u05E9\u05DC\u05D5\u05DE\u05D9\u05DD \u05D7\u05D5\u05D6\u05E8\u05D9\u05DD",
      classifyLaterTitle: "\u05E9\u05D9\u05E7\u05D9\u05DD \u05E7\u05D8\u05E0\u05D9\u05DD \u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D4\u05E9\u05E4\u05D9\u05E2 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: ["details_by_area", "audit_trail"],
    primaryActions: [
      {
        title: "\u05DC\u05E1\u05D5\u05D5\u05D2 \u05D0\u05EA \u05D4\u05E9\u05D9\u05E7 \u05D4\u05D7\u05D5\u05D6\u05E8",
        whyFirst: "\u05D4\u05D5\u05D0 \u05D9\u05DB\u05D5\u05DC \u05DC\u05D4\u05D9\u05D5\u05EA \u05D4\u05D5\u05E6\u05D0\u05D4 \u05E7\u05D1\u05D5\u05E2\u05D4 \u05D0\u05D5 \u05D4\u05E2\u05D1\u05E8\u05D4 \u05E9\u05DC\u05D0 \u05E6\u05E8\u05D9\u05DA \u05DC\u05E1\u05E4\u05D5\u05E8.",
        whatToDo: "\u05D1\u05D7\u05E8\u05D5 \u05D0\u05DD \u05DE\u05D3\u05D5\u05D1\u05E8 \u05D1\u05D3\u05D9\u05D5\u05E8, \u05D7\u05D5\u05D1, \u05D9\u05DC\u05D3\u05D9\u05DD, \u05D4\u05E2\u05D1\u05E8\u05D4 \u05E4\u05E0\u05D9\u05DE\u05D9\u05EA \u05D0\u05D5 \u05EA\u05E9\u05DC\u05D5\u05DD \u05D0\u05D7\u05E8.",
        amountType: "review_amount"
      }
    ],
    allowedClaims: ["\u05DE\u05E9\u05E4\u05D9\u05E2 \u05E2\u05DC \u05D1\u05E1\u05D9\u05E1 \u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA"],
    forbiddenClaims: ["\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF", "\u05D1\u05D6\u05D1\u05D5\u05D6"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["large recurring check"],
      neverBlockFor: ["one-time small check"]
    },
    evidenceRules: ["Show months seen and raw check descriptions."],
    claudeCopyHints: {
      tone: "clarifying",
      doSay: ["\u05E6\u05E8\u05D9\u05DA \u05DC\u05E1\u05D5\u05D5\u05D2 \u05DB\u05D3\u05D9 \u05DC\u05D0 \u05DC\u05D4\u05D8\u05E2\u05D5\u05EA"],
      doNotSay: ["\u05D1\u05E2\u05D9\u05D4"]
    }
  },
  // 15
  internal_transfer_risk: {
    id: "internal_transfer_risk",
    kind: "secondary_finding",
    priority: 380,
    label: "\u05E1\u05D9\u05DB\u05D5\u05DF \u05DC\u05E1\u05E4\u05D9\u05E8\u05D4 \u05DB\u05E4\u05D5\u05DC\u05D4 / \u05D4\u05E2\u05D1\u05E8\u05D4 \u05E4\u05E0\u05D9\u05DE\u05D9\u05EA",
    healthTone: "yellow",
    trigger: {
      description: "Large possible internal transfer exists.",
      test: (f) => f.internalTransferRiskTotal > 2e3
    },
    userFear: "\u05D4\u05D3\u05D5\u05D7 \u05E1\u05D5\u05E4\u05E8 \u05DB\u05E1\u05E3 \u05E9\u05E2\u05D1\u05E8 \u05D1\u05D9\u05DF \u05D7\u05E9\u05D1\u05D5\u05E0\u05D5\u05EA \u05DB\u05D0\u05D9\u05DC\u05D5 \u05D4\u05D5\u05D0 \u05D4\u05D5\u05E6\u05D0\u05D4.",
    mainAha: "\u05D9\u05D9\u05EA\u05DB\u05DF \u05E9\u05D7\u05DC\u05E7 \u05DE\u05D4\u05EA\u05E0\u05D5\u05E2\u05D5\u05EA \u05D4\u05DF \u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05E4\u05E0\u05D9\u05DE\u05D9\u05D5\u05EA \u05D5\u05DC\u05D0 \u05D4\u05D5\u05E6\u05D0\u05D4 \u05D0\u05DE\u05D9\u05EA\u05D9\u05EA.",
    ui: {
      bottomLineHeadline: "\u05D9\u05D9\u05EA\u05DB\u05DF \u05E9\u05D9\u05E9 \u05D4\u05E2\u05D1\u05E8\u05D4 \u05E4\u05E0\u05D9\u05DE\u05D9\u05EA \u05E9\u05DE\u05E9\u05E0\u05D4 \u05D0\u05EA \u05D4\u05D7\u05D9\u05E9\u05D5\u05D1",
      meaningTitle: "\u05DC\u05DE\u05D4 \u05D6\u05D4 \u05DE\u05E9\u05E0\u05D4",
      meaningBody: "\u05DB\u05E1\u05E3 \u05E9\u05E2\u05D1\u05E8 \u05D1\u05D9\u05DF \u05D7\u05E9\u05D1\u05D5\u05E0\u05D5\u05EA \u05DC\u05D0 \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05D9\u05E1\u05E4\u05E8 \u05DB\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D0\u05D5 \u05D4\u05D5\u05E6\u05D0\u05D4 \u05D7\u05D3\u05E9\u05D4.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05DE\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E9\u05E4\u05E8 \u05D0\u05D7\u05E8\u05D9 \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05E4\u05E0\u05D9\u05DE\u05D9\u05D5\u05EA",
      classifyLaterTitle: "\u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05D4\u05D7\u05E8\u05D2\u05D5\u05EA \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: ["details_by_area", "audit_trail"],
    primaryActions: [
      {
        title: "\u05DC\u05D1\u05D3\u05D5\u05E7 \u05D0\u05DD \u05D6\u05D5 \u05D4\u05E2\u05D1\u05E8\u05D4 \u05E4\u05E0\u05D9\u05DE\u05D9\u05EA",
        whyFirst: "\u05E1\u05D9\u05D5\u05D5\u05D2 \u05E9\u05D2\u05D5\u05D9 \u05D9\u05DB\u05D5\u05DC \u05DC\u05D4\u05E4\u05D5\u05DA \u05E2\u05D5\u05D3\u05E3 \u05DC\u05D7\u05D5\u05E1\u05E8 \u05D0\u05D5 \u05DC\u05D4\u05E4\u05DA.",
        whatToDo: "\u05D1\u05D3\u05E7\u05D5 \u05D0\u05DD \u05D4\u05DB\u05E1\u05E3 \u05E2\u05D1\u05E8 \u05D1\u05D9\u05DF \u05D7\u05E9\u05D1\u05D5\u05E0\u05D5\u05EA \u05E9\u05DC\u05DB\u05DD.",
        amountType: "review_amount"
      }
    ],
    allowedClaims: ["\u05D9\u05DB\u05D5\u05DC \u05DC\u05E9\u05E0\u05D5\u05EA \u05D0\u05EA \u05D4\u05D7\u05D9\u05E9\u05D5\u05D1"],
    forbiddenClaims: ["\u05D6\u05D5 \u05D1\u05D5\u05D5\u05D3\u05D0\u05D5\u05EA \u05D4\u05D5\u05E6\u05D0\u05D4", "\u05D6\u05D5 \u05D1\u05D5\u05D5\u05D3\u05D0\u05D5\u05EA \u05D4\u05DB\u05E0\u05E1\u05D4"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["material possible internal transfer"],
      neverBlockFor: ["small payment apps unless material"]
    },
    evidenceRules: ["Show direction and source account if available."],
    claudeCopyHints: {
      tone: "careful",
      doSay: ["\u05D9\u05D9\u05EA\u05DB\u05DF", "\u05E6\u05E8\u05D9\u05DA \u05DC\u05E1\u05D5\u05D5\u05D2"],
      doNotSay: ["\u05D1\u05D8\u05D5\u05D7"]
    }
  },
  // 16
  housing_heavy: {
    id: "housing_heavy",
    kind: "risk_context",
    priority: 360,
    label: "\u05D3\u05D9\u05D5\u05E8 \u05D2\u05D1\u05D5\u05D4 \u05D1\u05D9\u05D7\u05E1 \u05DC\u05D4\u05DB\u05E0\u05E1\u05D4",
    healthTone: "yellow",
    trigger: {
      description: "Housing cost is material.",
      test: (f) => f.housingMonthly > Math.max(5e3, f.fixedMonthlyIncome * 0.3)
    },
    userFear: "\u05D4\u05D3\u05D9\u05D5\u05E8 \u05D0\u05D5\u05DB\u05DC \u05D0\u05EA \u05E8\u05D5\u05D1 \u05D4\u05D4\u05DB\u05E0\u05E1\u05D4.",
    mainAha: "\u05D3\u05D9\u05D5\u05E8 \u05D4\u05D5\u05D0 \u05D4\u05D5\u05E6\u05D0\u05D4 \u05E7\u05D1\u05D5\u05E2\u05D4 \u05D2\u05D3\u05D5\u05DC\u05D4, \u05DC\u05D0 \u05E1\u05E2\u05D9\u05E3 \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DE\u05D9\u05D9\u05D3\u05D9.",
    ui: {
      bottomLineHeadline: "\u05D4\u05D3\u05D9\u05D5\u05E8 \u05D4\u05D5\u05D0 \u05D7\u05DC\u05E7 \u05DE\u05E9\u05DE\u05E2\u05D5\u05EA\u05D9 \u05DE\u05D4\u05D1\u05E1\u05D9\u05E1 \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9",
      meaningTitle: "\u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC",
      meaningBody: "\u05DC\u05D0 \u05DE\u05EA\u05D9\u05D9\u05D7\u05E1\u05D9\u05DD \u05DC\u05D3\u05D9\u05D5\u05E8 \u05DB\u05DE\u05D5 Wolt \u05D0\u05D5 \u05DE\u05E0\u05D5\u05D9\u05D9\u05DD. \u05D6\u05D5 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA \u05D1\u05E1\u05D9\u05E1\u05D9\u05EA \u05E9\u05DE\u05D2\u05D3\u05D9\u05E8\u05D4 \u05DB\u05DE\u05D4 \u05E0\u05E9\u05D0\u05E8 \u05DC\u05E9\u05DC\u05D9\u05D8\u05D4.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05DB\u05DF \u05D9\u05E9 \u05E9\u05DC\u05D9\u05D8\u05D4",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D3\u05D9\u05D5\u05E8",
      classifyLaterTitle: "\u05EA\u05E9\u05DC\u05D5\u05DE\u05D9 \u05D3\u05D9\u05D5\u05E8 \u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05E1\u05D9\u05D5\u05D5\u05D2 \u05D4\u05D3\u05D9\u05D5\u05E8 \u05D4\u05E9\u05E4\u05D9\u05E2 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: ["bottom_line", "meaning", "details_by_area"],
    primaryActions: [
      {
        title: "\u05DC\u05D4\u05DB\u05E0\u05D9\u05E1 \u05D3\u05D9\u05D5\u05E8 \u05DC\u05D1\u05E1\u05D9\u05E1 \u05D4\u05E7\u05D1\u05D5\u05E2",
        whyFirst: "\u05D6\u05D4 \u05DC\u05D0 \u05E1\u05E2\u05D9\u05E3 \u05E9\u05DE\u05E6\u05D9\u05D2\u05D9\u05DD \u05DB\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DE\u05D4\u05D9\u05E8.",
        whatToDo: "\u05D1\u05D3\u05E7\u05D5 \u05DB\u05DE\u05D4 \u05E0\u05E9\u05D0\u05E8 \u05D0\u05D7\u05E8\u05D9 \u05D3\u05D9\u05D5\u05E8 \u05D5\u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05D9\u05D5\u05EA \u05E7\u05D1\u05D5\u05E2\u05D5\u05EA.",
        amountType: "fixed_commitment",
        shouldShowAmountFrom: "housingMonthly"
      }
    ],
    allowedClaims: ["\u05D4\u05D5\u05E6\u05D0\u05D4 \u05E7\u05D1\u05D5\u05E2\u05D4", "\u05D7\u05DC\u05E7 \u05DE\u05D4\u05D1\u05E1\u05D9\u05E1"],
    forbiddenClaims: ["\u05DE\u05E7\u05D5\u05DD \u05DC\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05E7\u05DC"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["unclear recurring housing-sized payment"],
      neverBlockFor: ["known rent/mortgage"]
    },
    evidenceRules: ["Do not call housing a savings opportunity."],
    claudeCopyHints: {
      tone: "grounded",
      doSay: ["\u05D4\u05D5\u05E6\u05D0\u05D4 \u05E7\u05D1\u05D5\u05E2\u05D4"],
      doNotSay: ["\u05D1\u05D8\u05DC\u05D5", "\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05E7\u05DC"]
    }
  },
  // 17
  fixed_commitments_high: {
    id: "fixed_commitments_high",
    kind: "risk_context",
    priority: 350,
    label: "\u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05D9\u05D5\u05EA \u05E7\u05D1\u05D5\u05E2\u05D5\u05EA \u05D2\u05D1\u05D5\u05D4\u05D5\u05EA",
    healthTone: "yellow",
    trigger: {
      description: "Fixed commitments are high relative to income.",
      test: (f) => f.fixedCommitmentsMonthly > f.fixedMonthlyIncome * 0.55
    },
    userFear: "\u05D0\u05D9\u05DF \u05DE\u05E1\u05E4\u05D9\u05E7 \u05D2\u05DE\u05D9\u05E9\u05D5\u05EA \u05DB\u05D9 \u05D9\u05D5\u05EA\u05E8 \u05DE\u05D3\u05D9 \u05E7\u05D1\u05D5\u05E2.",
    mainAha: "\u05D7\u05DC\u05E7 \u05D2\u05D3\u05D5\u05DC \u05DE\u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05DB\u05D1\u05E8 \u05E0\u05E2\u05D5\u05DC \u05D1\u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05D9\u05D5\u05EA.",
    ui: {
      bottomLineHeadline: "\u05D7\u05DC\u05E7 \u05D2\u05D3\u05D5\u05DC \u05DE\u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05E0\u05E2\u05D5\u05DC \u05D1\u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05D9\u05D5\u05EA \u05E7\u05D1\u05D5\u05E2\u05D5\u05EA",
      meaningTitle: "\u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC",
      meaningBody: "\u05DB\u05E9\u05D9\u05D5\u05EA\u05E8 \u05DE\u05D3\u05D9 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D4\u05DF \u05E7\u05D1\u05D5\u05E2\u05D5\u05EA, \u05D4\u05E9\u05D9\u05E4\u05D5\u05E8 \u05DE\u05D2\u05D9\u05E2 \u05DE\u05E0\u05D9\u05D4\u05D5\u05DC \u05D1\u05E1\u05D9\u05E1 \u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D5\u05D4\u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05D4\u05D2\u05DE\u05D9\u05E9\u05D9\u05DD \u05E9\u05E0\u05D5\u05EA\u05E8\u05D5.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05E0\u05E9\u05D0\u05E8\u05D4 \u05E9\u05DC\u05D9\u05D8\u05D4",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05D9\u05D5\u05EA \u05E7\u05D1\u05D5\u05E2\u05D5\u05EA",
      classifyLaterTitle: "\u05EA\u05E9\u05DC\u05D5\u05DE\u05D9\u05DD \u05E7\u05D1\u05D5\u05E2\u05D9\u05DD \u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D1\u05E1\u05D9\u05E1 \u05D4\u05E7\u05D1\u05D5\u05E2"
    },
    recommendedSections: [
      "bottom_line",
      "meaning",
      "check_first",
      "details_by_area"
    ],
    primaryActions: [
      {
        title: "\u05DC\u05DE\u05E4\u05D5\u05EA \u05D0\u05EA \u05DB\u05DC \u05D4\u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05D9\u05D5\u05EA \u05D4\u05E7\u05D1\u05D5\u05E2\u05D5\u05EA",
        whyFirst: "\u05D6\u05D4 \u05DE\u05E8\u05D0\u05D4 \u05DB\u05DE\u05D4 \u05DB\u05E1\u05E3 \u05E0\u05E9\u05D0\u05E8 \u05DC\u05E9\u05DC\u05D9\u05D8\u05D4 \u05D0\u05DE\u05D9\u05EA\u05D9\u05EA.",
        whatToDo: "\u05D4\u05E4\u05E8\u05D9\u05D3\u05D5 \u05D3\u05D9\u05D5\u05E8, \u05D4\u05DC\u05D5\u05D5\u05D0\u05D5\u05EA, \u05D7\u05E9\u05D1\u05D5\u05E0\u05D5\u05EA \u05D5\u05D9\u05DC\u05D3\u05D9\u05DD \u05DE\u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05D2\u05DE\u05D9\u05E9\u05D9\u05DD.",
        amountType: "fixed_commitment"
      }
    ],
    allowedClaims: ["\u05E7\u05D1\u05D5\u05E2", "\u05E0\u05E2\u05D5\u05DC", "\u05DC\u05D0 \u05DE\u05E7\u05D5\u05DD \u05DC\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DE\u05D4\u05D9\u05E8"],
    forbiddenClaims: ["\u05D1\u05D8\u05DC\u05D5", "\u05E7\u05D9\u05E6\u05D5\u05E5 \u05E7\u05DC"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: ["unclear recurring fixed payment"],
      neverBlockFor: ["known utility"]
    },
    evidenceRules: ["Separate fixed commitments from flexible spending."],
    claudeCopyHints: {
      tone: "structured",
      doSay: ["\u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05D9\u05D5\u05EA \u05E7\u05D1\u05D5\u05E2\u05D5\u05EA"],
      doNotSay: ["\u05D1\u05D6\u05D1\u05D5\u05D6"]
    }
  },
  // 18
  food_delivery_restaurants_high: {
    id: "food_delivery_restaurants_high",
    kind: "secondary_finding",
    priority: 300,
    label: "Wolt / \u05DE\u05E1\u05E2\u05D3\u05D5\u05EA \u05D2\u05D1\u05D5\u05D4\u05D9\u05DD",
    healthTone: "yellow",
    trigger: {
      description: "Food delivery/restaurants are material flexible spend.",
      test: (f) => f.woltMonthly + f.restaurantsMonthly > Math.max(1200, f.monthlyExpenses * 0.06)
    },
    userFear: "\u05D0\u05D5\u05DB\u05DC \u05D1\u05D7\u05D5\u05E5 \u05DE\u05E6\u05D8\u05D1\u05E8 \u05D1\u05DC\u05D9 \u05E9\u05DE\u05E8\u05D2\u05D9\u05E9\u05D9\u05DD.",
    mainAha: "\u05D6\u05D4 \u05E1\u05E2\u05D9\u05E3 \u05D2\u05DE\u05D9\u05E9 \u05D2\u05D3\u05D5\u05DC \u05E9\u05D0\u05E4\u05E9\u05E8 \u05DC\u05D4\u05D7\u05DC\u05D9\u05D8 \u05E2\u05DC\u05D9\u05D5 \u05D1\u05DE\u05D5\u05D3\u05E2.",
    ui: {
      bottomLineHeadline: "Wolt \u05D5\u05DE\u05E1\u05E2\u05D3\u05D5\u05EA \u05D4\u05DD \u05E1\u05E2\u05D9\u05E3 \u05D2\u05DE\u05D9\u05E9 \u05DE\u05E9\u05DE\u05E2\u05D5\u05EA\u05D9",
      meaningTitle: "\u05DC\u05DE\u05D4 \u05D6\u05D4 \u05DE\u05E9\u05E0\u05D4",
      meaningBody: "\u05D6\u05D4 \u05DC\u05D0 \u05D0\u05D5\u05DE\u05E8 \u05DC\u05D1\u05D8\u05DC \u05D0\u05D5\u05DB\u05DC \u05D1\u05D7\u05D5\u05E5. \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05E9\u05D4\u05E1\u05DB\u05D5\u05DD \u05DE\u05E1\u05E4\u05D9\u05E7 \u05D2\u05D3\u05D5\u05DC \u05DB\u05D3\u05D9 \u05DC\u05D4\u05D2\u05D3\u05D9\u05E8 \u05DC\u05D5 \u05EA\u05E7\u05E8\u05D4.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D9\u05E9 \u05E9\u05DC\u05D9\u05D8\u05D4",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 Wolt \u05D5\u05DE\u05E1\u05E2\u05D3\u05D5\u05EA",
      classifyLaterTitle: "\u05E2\u05E1\u05E7\u05D0\u05D5\u05EA \u05D0\u05D5\u05DB\u05DC \u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05E7\u05D8\u05D2\u05D5\u05E8\u05D9\u05D9\u05EA \u05D4\u05D0\u05D5\u05DB\u05DC \u05D7\u05D5\u05E9\u05D1\u05D4"
    },
    recommendedSections: ["control_opportunities", "details_by_area"],
    primaryActions: [
      {
        title: "\u05DC\u05D4\u05D2\u05D3\u05D9\u05E8 \u05EA\u05E7\u05E8\u05D4 \u05DC\u05BEWolt \u05D5\u05DE\u05E1\u05E2\u05D3\u05D5\u05EA",
        whyFirst: "\u05D6\u05D4 \u05E1\u05E2\u05D9\u05E3 \u05D2\u05DE\u05D9\u05E9, \u05DC\u05D0 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05EA.",
        whatToDo: "\u05D1\u05D3\u05E7\u05D5 \u05D0\u05DD \u05E6\u05DE\u05E6\u05D5\u05DD \u05E9\u05DC 20%-30% \u05D0\u05E4\u05E9\u05E8\u05D9 \u05D1\u05DC\u05D9 \u05DC\u05D1\u05D8\u05DC \u05DC\u05D2\u05DE\u05E8\u05D9.",
        amountType: "review_amount",
        shouldShowAmountFrom: "woltMonthly"
      }
    ],
    allowedClaims: ["\u05E1\u05E2\u05D9\u05E3 \u05D2\u05DE\u05D9\u05E9", "\u05D0\u05E4\u05E9\u05E8 \u05DC\u05D4\u05D2\u05D3\u05D9\u05E8 \u05EA\u05E7\u05E8\u05D4"],
    forbiddenClaims: ["\u05D1\u05D6\u05D1\u05D5\u05D6", "\u05EA\u05E4\u05E1\u05D9\u05E7\u05D5 \u05DC\u05D4\u05D6\u05DE\u05D9\u05DF"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["wolt", "restaurants"]
    },
    evidenceRules: [
      "Show transaction count and monthly average if available."
    ],
    claudeCopyHints: {
      tone: "non-judgmental",
      doSay: ["\u05DC\u05D4\u05D7\u05DC\u05D9\u05D8 \u05D1\u05DE\u05D5\u05D3\u05E2", "\u05DC\u05D4\u05D2\u05D3\u05D9\u05E8 \u05EA\u05E7\u05E8\u05D4"],
      doNotSay: ["\u05D1\u05D6\u05D1\u05D5\u05D6\u05D9\u05DD"]
    }
  },
  // 19
  subscriptions_creep: {
    id: "subscriptions_creep",
    kind: "secondary_finding",
    priority: 280,
    label: "\u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4",
    healthTone: "yellow",
    trigger: {
      description: "Subscriptions are material.",
      test: (f) => f.subscriptionsMonthly > 500
    },
    userFear: "\u05D9\u05E9 \u05D4\u05E8\u05D1\u05D4 \u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05D0\u05D1\u05DC \u05DC\u05D0 \u05D1\u05E8\u05D5\u05E8 \u05DE\u05D4 \u05D1\u05D0\u05DE\u05EA \u05D1\u05E9\u05D9\u05DE\u05D5\u05E9.",
    mainAha: "\u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05D4\u05DD \u05E1\u05DB\u05D5\u05DD \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4, \u05DC\u05D0 \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DE\u05D5\u05D1\u05D8\u05D7.",
    ui: {
      bottomLineHeadline: "\u05DE\u05E6\u05D0\u05E0\u05D5 \u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05D5\u05DB\u05DC\u05D9\u05DD \u05D3\u05D9\u05D2\u05D9\u05D8\u05DC\u05D9\u05D9\u05DD \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4",
      meaningTitle: "\u05DC\u05DE\u05D4 \u05D6\u05D4 \u05DE\u05E9\u05E0\u05D4",
      meaningBody: "\u05DC\u05D0 \u05DB\u05D5\u05DC\u05DD \u05DE\u05D9\u05D5\u05EA\u05E8\u05D9\u05DD. \u05D4\u05E4\u05D5\u05D8\u05E0\u05E6\u05D9\u05D0\u05DC \u05EA\u05DC\u05D5\u05D9 \u05D1\u05DE\u05D4 \u05E9\u05D1\u05D0\u05DE\u05EA \u05D1\u05E9\u05D9\u05DE\u05D5\u05E9 \u05D5\u05D1\u05D7\u05E4\u05D9\u05E4\u05D5\u05EA.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05E9\u05E4\u05E8",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05DE\u05E0\u05D5\u05D9\u05D9\u05DD",
      classifyLaterTitle: "\u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05D7\u05D5\u05E9\u05D1\u05D5"
    },
    recommendedSections: ["control_opportunities", "details_by_area"],
    primaryActions: [
      {
        title: "\u05DC\u05E2\u05D1\u05D5\u05E8 \u05E2\u05DC \u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05D5\u05DB\u05DC\u05D9\u05DD \u05D3\u05D9\u05D2\u05D9\u05D8\u05DC\u05D9\u05D9\u05DD",
        whyFirst: "\u05D6\u05D4 \u05E1\u05E2\u05D9\u05E3 \u05DE\u05E4\u05D5\u05D6\u05E8 \u05E9\u05E7\u05E9\u05D4 \u05DC\u05E8\u05D0\u05D5\u05EA \u05D9\u05D3\u05E0\u05D9\u05EA.",
        whatToDo: "\u05E1\u05DE\u05E0\u05D5 \u05DE\u05D4 \u05D1\u05E9\u05D9\u05DE\u05D5\u05E9 \u05D5\u05DE\u05D4 \u05D7\u05D5\u05E4\u05E3. \u05D0\u05DC \u05EA\u05D1\u05D8\u05DC\u05D5 \u05DC\u05E4\u05D9 \u05E1\u05DB\u05D5\u05DD \u05D1\u05DC\u05D1\u05D3.",
        amountType: "review_amount",
        shouldShowAmountFrom: "subscriptionsMonthly"
      }
    ],
    allowedClaims: ["\u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4", "\u05E4\u05D5\u05D8\u05E0\u05E6\u05D9\u05D0\u05DC \u05EA\u05DC\u05D5\u05D9 \u05D1\u05E9\u05D9\u05DE\u05D5\u05E9"],
    forbiddenClaims: [
      "\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DE\u05D5\u05D1\u05D8\u05D7",
      "\u05E4\u05D5\u05D8\u05E0\u05E6\u05D9\u05D0\u05DC \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05E2\u05D3 \u05DB\u05DC \u05D4\u05E1\u05DB\u05D5\u05DD"
    ],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["subscriptions"]
    },
    evidenceRules: [
      "Show supplier breakdown only if evidence exists.",
      "Never show \u20AA0 evidence rows.",
      "confirmed_savings only if duplicate/unused evidence exists."
    ],
    claudeCopyHints: {
      tone: "careful",
      doSay: ["\u05DC\u05D1\u05D3\u05D9\u05E7\u05D4", "\u05EA\u05DC\u05D5\u05D9 \u05D1\u05DE\u05D4 \u05E9\u05D1\u05E9\u05D9\u05DE\u05D5\u05E9"],
      doNotSay: ["\u05D1\u05D8\u05DC\u05D5 \u05D4\u05DB\u05DC", "\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DE\u05D5\u05D1\u05D8\u05D7"]
    }
  },
  // 20
  payment_apps_blind_spot: {
    id: "payment_apps_blind_spot",
    kind: "secondary_finding",
    priority: 260,
    label: "BIT / PayBox \u05D0\u05D6\u05D5\u05E8 \u05E2\u05D9\u05D5\u05D5\u05E8",
    healthTone: "yellow",
    trigger: {
      description: "Payment app volume is material.",
      test: (f) => f.paymentAppsMonthly > 750
    },
    userFear: "\u05D1\u05D9\u05D8 \u05D5\u05E4\u05D9\u05D9\u05D1\u05D5\u05E7\u05E1 \u05E0\u05D1\u05DC\u05E2\u05D9\u05DD \u05D5\u05E7\u05E9\u05D4 \u05DC\u05D3\u05E2\u05EA \u05DE\u05D4 \u05D4\u05DD.",
    mainAha: "BIT \u05D5\u05BEPayBox \u05D4\u05DD \u05D0\u05D6\u05D5\u05E8 \u05E2\u05D9\u05D5\u05D5\u05E8 \u05E2\u05D3 \u05E9\u05DE\u05E1\u05D5\u05D5\u05D2\u05D9\u05DD \u05D0\u05D5\u05EA\u05DD.",
    ui: {
      bottomLineHeadline: "BIT \u05D5\u05BEPayBox \u05D4\u05DD \u05D0\u05D6\u05D5\u05E8 \u05E2\u05D9\u05D5\u05D5\u05E8",
      meaningTitle: "\u05DC\u05DE\u05D4 \u05D6\u05D4 \u05DE\u05E9\u05E0\u05D4",
      meaningBody: "\u05D7\u05DC\u05E7 \u05D9\u05DB\u05D5\u05DC \u05DC\u05D4\u05D9\u05D5\u05EA \u05D4\u05D7\u05D6\u05E8\u05D9\u05DD, \u05E7\u05E0\u05D9\u05D5\u05EA \u05DE\u05E9\u05D5\u05EA\u05E4\u05D5\u05EA \u05D0\u05D5 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D0\u05DE\u05D9\u05EA\u05D9\u05D5\u05EA. \u05DC\u05D0 \u05DE\u05E6\u05D9\u05D2\u05D9\u05DD \u05D0\u05EA \u05D6\u05D4 \u05DB\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05DC\u05E4\u05E0\u05D9 \u05E1\u05D9\u05D5\u05D5\u05D2.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D9\u05E9 \u05E9\u05DC\u05D9\u05D8\u05D4 \u05D0\u05D7\u05E8\u05D9 \u05E1\u05D9\u05D5\u05D5\u05D2",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 BIT / PayBox",
      classifyLaterTitle: "\u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05EA\u05E9\u05DC\u05D5\u05DE\u05D9 \u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05D8\u05D5\u05E4\u05DC\u05D5"
    },
    recommendedSections: ["details_by_area", "classify_later"],
    primaryActions: [
      {
        title: "\u05DC\u05E1\u05D5\u05D5\u05D2 \u05D0\u05EA \u05EA\u05E0\u05D5\u05E2\u05D5\u05EA BIT / PayBox \u05D4\u05D2\u05D3\u05D5\u05DC\u05D5\u05EA",
        whyFirst: "\u05D6\u05D4 \u05D0\u05D6\u05D5\u05E8 \u05E2\u05D9\u05D5\u05D5\u05E8, \u05DC\u05D0 \u05D1\u05D4\u05DB\u05E8\u05D7 \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF.",
        whatToDo: "\u05E1\u05D5\u05D5\u05D2\u05D5 \u05D0\u05EA 10-15 \u05D4\u05EA\u05E0\u05D5\u05E2\u05D5\u05EA \u05D4\u05D2\u05D3\u05D5\u05DC\u05D5\u05EA.",
        amountType: "review_amount",
        shouldShowAmountFrom: "paymentAppsMonthly"
      }
    ],
    allowedClaims: ["\u05D0\u05D6\u05D5\u05E8 \u05E2\u05D9\u05D5\u05D5\u05E8", "\u05D3\u05D5\u05E8\u05E9 \u05E1\u05D9\u05D5\u05D5\u05D2"],
    forbiddenClaims: ["\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF", "\u05D1\u05D6\u05D1\u05D5\u05D6"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["payment apps before report"]
    },
    evidenceRules: [
      "Group payment apps; do not block the report."
    ],
    claudeCopyHints: {
      tone: "curious",
      doSay: ["\u05D0\u05D6\u05D5\u05E8 \u05E2\u05D9\u05D5\u05D5\u05E8", "\u05E6\u05E8\u05D9\u05DA \u05DC\u05E1\u05D5\u05D5\u05D2"],
      doNotSay: ["\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF"]
    }
  },
  // 21
  municipal_education_review: {
    id: "municipal_education_review",
    kind: "secondary_finding",
    priority: 240,
    label: "\u05E2\u05D9\u05E8\u05D9\u05D9\u05D4 / \u05D7\u05D9\u05E0\u05D5\u05DA \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4",
    healthTone: "yellow",
    trigger: {
      description: "Municipal or education payments are material.",
      test: (f) => f.municipalMonthly > 500
    },
    userFear: "\u05E2\u05D9\u05E8\u05D9\u05D9\u05D4, \u05DE\u05D9\u05DD, \u05D7\u05D9\u05E0\u05D5\u05DA \u05D5\u05D7\u05D5\u05D2\u05D9\u05DD \u05DE\u05EA\u05E2\u05E8\u05D1\u05D1\u05D9\u05DD.",
    mainAha: "\u05EA\u05E9\u05DC\u05D5\u05DE\u05D9\u05DD \u05E2\u05D9\u05E8\u05D5\u05E0\u05D9\u05D9\u05DD \u05E6\u05E8\u05D9\u05DB\u05D9\u05DD \u05E4\u05D9\u05E6\u05D5\u05DC, \u05DC\u05D0 \u05E4\u05D0\u05E0\u05D9\u05E7\u05D4.",
    ui: {
      bottomLineHeadline: "\u05EA\u05E9\u05DC\u05D5\u05DE\u05D9\u05DD \u05E2\u05D9\u05E8\u05D5\u05E0\u05D9\u05D9\u05DD \u05D5\u05D7\u05D9\u05E0\u05D5\u05DA \u05D3\u05D5\u05E8\u05E9\u05D9\u05DD \u05E4\u05D9\u05E6\u05D5\u05DC",
      meaningTitle: "\u05DC\u05DE\u05D4 \u05D6\u05D4 \u05DE\u05E9\u05E0\u05D4",
      meaningBody: "\u05E2\u05D9\u05E8\u05D9\u05D9\u05D4 \u05D9\u05DB\u05D5\u05DC\u05D4 \u05DC\u05DB\u05DC\u05D5\u05DC \u05D0\u05E8\u05E0\u05D5\u05E0\u05D4, \u05DE\u05D9\u05DD, \u05D7\u05D9\u05E0\u05D5\u05DA, \u05D7\u05D5\u05D2\u05D9\u05DD \u05D0\u05D5 \u05D0\u05D2\u05E8\u05D5\u05EA. \u05DC\u05D0 \u05DE\u05E6\u05D9\u05D2\u05D9\u05DD \u05D0\u05EA \u05D6\u05D4 \u05DB\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05D1\u05DC\u05D9 \u05E1\u05D9\u05D5\u05D5\u05D2.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D3\u05D9\u05D9\u05E7",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05E2\u05D9\u05E8\u05D9\u05D9\u05D4 / \u05D7\u05D9\u05E0\u05D5\u05DA",
      classifyLaterTitle: "\u05D7\u05D9\u05D5\u05D1\u05D9\u05DD \u05E2\u05D9\u05E8\u05D5\u05E0\u05D9\u05D9\u05DD \u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05EA\u05E9\u05DC\u05D5\u05DE\u05D9\u05DD \u05E2\u05D9\u05E8\u05D5\u05E0\u05D9\u05D9\u05DD \u05D8\u05D5\u05E4\u05DC\u05D5"
    },
    recommendedSections: ["details_by_area", "classify_later"],
    primaryActions: [
      {
        title: "\u05DC\u05E4\u05E6\u05DC \u05EA\u05E9\u05DC\u05D5\u05DE\u05D9\u05DD \u05E2\u05D9\u05E8\u05D5\u05E0\u05D9\u05D9\u05DD \u05DC\u05E4\u05D9 \u05E1\u05D5\u05D2",
        whyFirst: "\u05D0\u05D5\u05EA\u05D5 \u05E1\u05E4\u05E7 \u05D9\u05DB\u05D5\u05DC \u05DC\u05DB\u05DC\u05D5\u05DC \u05DB\u05DE\u05D4 \u05E1\u05D5\u05D2\u05D9 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E9\u05D5\u05E0\u05D9\u05DD.",
        whatToDo: "\u05D4\u05E4\u05E8\u05D9\u05D3\u05D5 \u05D0\u05E8\u05E0\u05D5\u05E0\u05D4, \u05DE\u05D9\u05DD, \u05D7\u05D9\u05E0\u05D5\u05DA, \u05D7\u05D5\u05D2\u05D9\u05DD \u05D5\u05D0\u05D2\u05E8\u05D5\u05EA.",
        amountType: "review_amount",
        shouldShowAmountFrom: "municipalMonthly"
      }
    ],
    allowedClaims: ["\u05D3\u05D5\u05E8\u05E9 \u05E4\u05D9\u05E6\u05D5\u05DC", "\u05DC\u05D0 \u05D1\u05D4\u05DB\u05E8\u05D7 \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF"],
    forbiddenClaims: ["\u05DB\u05E4\u05D9\u05DC\u05D5\u05EA \u05D5\u05D3\u05D0\u05D9\u05EA", "\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05D5\u05D3\u05D0\u05D9"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: ["municipal charges before report"]
    },
    evidenceRules: ["Never make municipal automatically blocking."],
    claudeCopyHints: {
      tone: "organized",
      doSay: ["\u05DC\u05E4\u05E6\u05DC \u05DC\u05E4\u05D9 \u05E1\u05D5\u05D2"],
      doNotSay: ["\u05DB\u05E4\u05D9\u05DC\u05D5\u05EA"]
    }
  },
  // 22
  medical_health_one_time: {
    id: "medical_health_one_time",
    kind: "secondary_finding",
    priority: 220,
    label: "\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E8\u05E4\u05D5\u05D0\u05D9\u05D5\u05EA \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05D5\u05EA",
    healthTone: "neutral",
    trigger: {
      description: "One-time medical/health charges exist.",
      test: (f) => f.medicalOneTimeTotal > 500
    },
    userFear: "\u05D4\u05D5\u05E6\u05D0\u05D4 \u05E8\u05E4\u05D5\u05D0\u05D9\u05EA \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05EA \u05E0\u05E8\u05D0\u05D9\u05EA \u05DB\u05DE\u05D5 \u05D3\u05E4\u05D5\u05E1.",
    mainAha: "\u05D4\u05D5\u05E6\u05D0\u05D4 \u05E8\u05E4\u05D5\u05D0\u05D9\u05EA \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05EA \u05DC\u05D0 \u05E6\u05E8\u05D9\u05DB\u05D4 \u05DC\u05E2\u05E6\u05D5\u05E8 \u05D0\u05EA \u05D4\u05D3\u05D5\u05D7.",
    ui: {
      bottomLineHeadline: "\u05D6\u05D5\u05D4\u05D5 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E8\u05E4\u05D5\u05D0\u05D9\u05D5\u05EA \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05D5\u05EA",
      meaningTitle: "\u05DC\u05DE\u05D4 \u05D6\u05D4 \u05DE\u05E9\u05E0\u05D4",
      meaningBody: "\u05DC\u05D0 \u05DB\u05DC \u05D4\u05D5\u05E6\u05D0\u05D4 \u05E8\u05E4\u05D5\u05D0\u05D9\u05EA \u05D4\u05D9\u05D0 \u05D3\u05E4\u05D5\u05E1 \u05D7\u05D5\u05D3\u05E9\u05D9. \u05D0\u05DD \u05D4\u05D9\u05D0 \u05DC\u05D0 \u05D7\u05D5\u05D6\u05E8\u05EA, \u05D4\u05D9\u05D0 \u05E0\u05E9\u05D0\u05E8\u05EA \u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05DE\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D3\u05D9\u05D9\u05E7",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D1\u05E8\u05D9\u05D0\u05D5\u05EA \u05D5\u05E8\u05E4\u05D5\u05D0\u05D4",
      classifyLaterTitle: "\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E8\u05E4\u05D5\u05D0\u05D9\u05D5\u05EA \u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E8\u05E4\u05D5\u05D0\u05D9\u05D5\u05EA \u05D8\u05D5\u05E4\u05DC\u05D5"
    },
    recommendedSections: ["classify_later", "details_by_area"],
    primaryActions: [
      {
        title: "\u05DC\u05D4\u05E9\u05D0\u05D9\u05E8 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E8\u05E4\u05D5\u05D0\u05D9\u05D5\u05EA \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05D5\u05EA \u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
        whyFirst: "\u05D4\u05DF \u05DC\u05D0 \u05E6\u05E8\u05D9\u05DB\u05D5\u05EA \u05DC\u05E2\u05DB\u05D1 \u05D0\u05EA \u05D4\u05D3\u05D5\u05D7 \u05D4\u05E8\u05D0\u05E9\u05D9.",
        whatToDo: "\u05D1\u05D3\u05E7\u05D5 \u05E8\u05E7 \u05D0\u05DD \u05D4\u05DF \u05D7\u05D5\u05D6\u05E8\u05D5\u05EA \u05D0\u05D5 \u05DE\u05D5\u05D7\u05D6\u05E8\u05D5\u05EA.",
        amountType: "review_amount"
      }
    ],
    allowedClaims: ["\u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9", "\u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA"],
    forbiddenClaims: ["\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF", "\u05D1\u05E2\u05D9\u05D4"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: [
        "MaccabiDent under 2000 once",
        "pharmacy once"
      ]
    },
    evidenceRules: [
      "Place one-time medical charges in non_blocking_items."
    ],
    claudeCopyHints: {
      tone: "calm",
      doSay: ["\u05DC\u05D0 \u05E2\u05E6\u05E8\u05E0\u05D5 \u05D1\u05E9\u05D1\u05D9\u05DC \u05D6\u05D4 \u05D0\u05EA \u05D4\u05D3\u05D5\u05D7"],
      doNotSay: ["\u05D1\u05E2\u05D9\u05D4"]
    }
  },
  // 23
  business_reimbursable_expenses: {
    id: "business_reimbursable_expenses",
    kind: "secondary_finding",
    priority: 210,
    label: "\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E2\u05E1\u05E7\u05D9\u05D5\u05EA / \u05DE\u05D5\u05D7\u05D6\u05E8\u05D5\u05EA \u05D0\u05E4\u05E9\u05E8\u05D9\u05D5\u05EA",
    healthTone: "yellow",
    trigger: {
      description: "Possible business or reimbursable expenses detected.",
      test: (f) => f.businessOrReimbursablePossibleTotal > 1e3
    },
    userFear: "\u05D4\u05D3\u05D5\u05D7 \u05E1\u05D5\u05E4\u05E8 \u05D4\u05D5\u05E6\u05D0\u05D4 \u05E4\u05E8\u05D8\u05D9\u05EA \u05DC\u05DE\u05E8\u05D5\u05EA \u05E9\u05D4\u05D9\u05D0 \u05E2\u05E1\u05E7\u05D9\u05EA \u05D0\u05D5 \u05DE\u05D5\u05D7\u05D6\u05E8\u05EA.",
    mainAha: "\u05D9\u05D9\u05EA\u05DB\u05DF \u05E9\u05D7\u05DC\u05E7 \u05DE\u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05DC\u05D0 \u05D1\u05D0\u05DE\u05EA \u05D4\u05D5\u05E6\u05D0\u05D4 \u05DE\u05E9\u05E4\u05D7\u05EA\u05D9\u05EA \u05E0\u05D8\u05D5.",
    ui: {
      bottomLineHeadline: "\u05D9\u05D9\u05EA\u05DB\u05DF \u05E9\u05D7\u05DC\u05E7 \u05DE\u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E2\u05E1\u05E7\u05D9\u05D5\u05EA \u05D0\u05D5 \u05DE\u05D5\u05D7\u05D6\u05E8\u05D5\u05EA",
      meaningTitle: "\u05DC\u05DE\u05D4 \u05D6\u05D4 \u05DE\u05E9\u05E0\u05D4",
      meaningBody: "\u05D0\u05DD \u05D4\u05D5\u05E6\u05D0\u05D4 \u05DE\u05D5\u05D7\u05D6\u05E8\u05EA \u05D0\u05D5 \u05E2\u05E1\u05E7\u05D9\u05EA, \u05DC\u05D0 \u05E0\u05DB\u05D5\u05DF \u05DC\u05D4\u05E6\u05D9\u05D2 \u05D0\u05D5\u05EA\u05D4 \u05DB\u05D4\u05D5\u05E6\u05D0\u05D4 \u05DE\u05E9\u05E4\u05D7\u05EA\u05D9\u05EA \u05E8\u05D2\u05D9\u05DC\u05D4.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05DE\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D3\u05D9\u05D9\u05E7",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E2\u05E1\u05E7\u05D9\u05D5\u05EA / \u05DE\u05D5\u05D7\u05D6\u05E8\u05D5\u05EA",
      classifyLaterTitle: "\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05DE\u05D5\u05D7\u05D6\u05E8\u05D5\u05EA \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: ["details_by_area", "classify_later"],
    primaryActions: [
      {
        title: "\u05DC\u05D1\u05D3\u05D5\u05E7 \u05D0\u05D9\u05DC\u05D5 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05DE\u05D5\u05D7\u05D6\u05E8\u05D5\u05EA \u05D0\u05D5 \u05E2\u05E1\u05E7\u05D9\u05D5\u05EA",
        whyFirst: "\u05D6\u05D4 \u05D9\u05DB\u05D5\u05DC \u05DC\u05E9\u05E0\u05D5\u05EA \u05D0\u05EA \u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D4\u05DE\u05E9\u05E4\u05D7\u05EA\u05D9\u05D5\u05EA \u05D4\u05D0\u05DE\u05D9\u05EA\u05D9\u05D5\u05EA.",
        whatToDo: "\u05E1\u05DE\u05E0\u05D5 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E9\u05DE\u05D5\u05D7\u05D6\u05E8\u05D5\u05EA \u05DE\u05D4\u05DE\u05E2\u05E1\u05D9\u05E7 \u05D0\u05D5 \u05E9\u05D9\u05D9\u05DB\u05D5\u05EA \u05DC\u05E2\u05E1\u05E7.",
        amountType: "review_amount"
      }
    ],
    allowedClaims: ["\u05D9\u05D9\u05EA\u05DB\u05DF \u05E9\u05DE\u05D5\u05D7\u05D6\u05E8", "\u05D3\u05D5\u05E8\u05E9 \u05E1\u05D9\u05D5\u05D5\u05D2"],
    forbiddenClaims: ["\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF", "\u05D1\u05D8\u05D5\u05D7 \u05E2\u05E1\u05E7\u05D9"],
    blockingGuidance: {
      canCreateBlockingQuestions: true,
      blockingOnlyFor: [
        "large reimbursable item that changes monthly result"
      ],
      neverBlockFor: ["small vendor charges"]
    },
    evidenceRules: [
      "Do not exclude unless user confirmed or strong evidence exists."
    ],
    claudeCopyHints: {
      tone: "careful",
      doSay: ["\u05D9\u05D9\u05EA\u05DB\u05DF", "\u05D3\u05D5\u05E8\u05E9 \u05E1\u05D9\u05D5\u05D5\u05D2"],
      doNotSay: ["\u05D1\u05D8\u05D5\u05D7"]
    }
  },
  // 24
  seasonal_family_expenses: {
    id: "seasonal_family_expenses",
    kind: "secondary_finding",
    priority: 200,
    label: "\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05DE\u05E9\u05E4\u05D7\u05EA\u05D9\u05D5\u05EA \u05E2\u05D5\u05E0\u05EA\u05D9\u05D5\u05EA",
    healthTone: "yellow",
    trigger: {
      description: "Seasonal family expenses are material.",
      test: (f) => f.seasonalFamilyExpensesTotal > 1500
    },
    userFear: "\u05D7\u05D5\u05D3\u05E9 \u05D7\u05D2\u05D9\u05DD/\u05E7\u05D9\u05D9\u05D8\u05E0\u05D5\u05EA/\u05D7\u05D6\u05E8\u05D4 \u05DC\u05DC\u05D9\u05DE\u05D5\u05D3\u05D9\u05DD \u05E0\u05E8\u05D0\u05D4 \u05DB\u05DE\u05D5 \u05D7\u05D5\u05D3\u05E9 \u05E8\u05D2\u05D9\u05DC.",
    mainAha: "\u05D9\u05E9 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E2\u05D5\u05E0\u05EA\u05D9\u05D5\u05EA \u05E9\u05DC\u05D0 \u05E0\u05DB\u05D5\u05DF \u05DC\u05D4\u05E4\u05D5\u05DA \u05DC\u05D4\u05E8\u05D2\u05DC \u05D7\u05D5\u05D3\u05E9\u05D9.",
    ui: {
      bottomLineHeadline: "\u05D9\u05E9 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05DE\u05E9\u05E4\u05D7\u05EA\u05D9\u05D5\u05EA \u05E2\u05D5\u05E0\u05EA\u05D9\u05D5\u05EA \u05E9\u05DE\u05E9\u05E0\u05D5\u05EA \u05D0\u05EA \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4",
      meaningTitle: "\u05DC\u05DE\u05D4 \u05D6\u05D4 \u05DE\u05E9\u05E0\u05D4",
      meaningBody: "\u05D7\u05D2\u05D9\u05DD, \u05E7\u05D9\u05D9\u05D8\u05E0\u05D5\u05EA, \u05D7\u05D6\u05E8\u05D4 \u05DC\u05DC\u05D9\u05DE\u05D5\u05D3\u05D9\u05DD \u05D0\u05D5 \u05D0\u05D9\u05E8\u05D5\u05E2\u05D9\u05DD \u05DE\u05E9\u05E4\u05D7\u05EA\u05D9\u05D9\u05DD \u05D9\u05DB\u05D5\u05DC\u05D9\u05DD \u05DC\u05E2\u05D5\u05D5\u05EA \u05D0\u05EA \u05D4\u05D7\u05D5\u05D3\u05E9.",
      checkFirstTitle: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      controlTitle: "\u05D0\u05D9\u05E4\u05D4 \u05D0\u05E4\u05E9\u05E8 \u05DC\u05D4\u05EA\u05DB\u05D5\u05E0\u05DF",
      detailsTitle: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05DE\u05E9\u05E4\u05D7\u05EA\u05D9\u05D5\u05EA \u05E2\u05D5\u05E0\u05EA\u05D9\u05D5\u05EA",
      classifyLaterTitle: "\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05E2\u05D5\u05E0\u05EA\u05D9\u05D5\u05EA \u05DC\u05E1\u05D9\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      auditTrailTitle: "\u05D0\u05D9\u05DA \u05E2\u05D5\u05E0\u05EA\u05D9\u05D5\u05EA \u05D4\u05E9\u05E4\u05D9\u05E2\u05D4 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7"
    },
    recommendedSections: ["details_by_area", "classify_later"],
    primaryActions: [
      {
        title: "\u05DC\u05D4\u05E4\u05E8\u05D9\u05D3 \u05E2\u05D5\u05E0\u05EA\u05D9 \u05DE\u05D4\u05E9\u05D5\u05D8\u05E3",
        whyFirst: "\u05DB\u05DA \u05DC\u05D0 \u05DE\u05E7\u05D1\u05DC\u05D9\u05DD \u05D4\u05D7\u05DC\u05D8\u05D5\u05EA \u05E2\u05DC \u05E1\u05DE\u05DA \u05D7\u05D5\u05D3\u05E9 \u05D7\u05E8\u05D9\u05D2.",
        whatToDo: "\u05E1\u05DE\u05E0\u05D5 \u05D7\u05D2\u05D9\u05DD, \u05E7\u05D9\u05D9\u05D8\u05E0\u05D5\u05EA, \u05D7\u05D6\u05E8\u05D4 \u05DC\u05DC\u05D9\u05DE\u05D5\u05D3\u05D9\u05DD \u05D5\u05D0\u05D9\u05E8\u05D5\u05E2\u05D9\u05DD \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05D9\u05DD.",
        amountType: "review_amount"
      }
    ],
    allowedClaims: ["\u05E2\u05D5\u05E0\u05EA\u05D9", "\u05DC\u05D0 \u05D1\u05D4\u05DB\u05E8\u05D7 \u05D7\u05D5\u05D3\u05E9\u05D9"],
    forbiddenClaims: ["\u05D3\u05E4\u05D5\u05E1 \u05E7\u05D1\u05D5\u05E2", "\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05D1\u05D8\u05D5\u05D7"],
    blockingGuidance: {
      canCreateBlockingQuestions: false,
      blockingOnlyFor: [],
      neverBlockFor: [
        "seasonal family expense before report unless huge and unclear"
      ]
    },
    evidenceRules: [
      "Show as seasonal/review, not fixed monthly behavior."
    ],
    claudeCopyHints: {
      tone: "contextual",
      doSay: ["\u05E2\u05D5\u05E0\u05EA\u05D9", "\u05DC\u05D0 \u05D7\u05D5\u05D3\u05E9 \u05E8\u05D2\u05D9\u05DC"],
      doNotSay: ["\u05EA\u05DE\u05D9\u05D3"]
    }
  }
};
function selectPlaybooks(facts) {
  const all = Object.values(PLAYBOOKS).filter((p) => p.trigger.test(facts)).sort((a, b) => b.priority - a.priority);
  const primary = all.find((p) => p.kind === "data_quality") || all.find((p) => p.kind === "primary_diagnosis") || PLAYBOOKS.stable_healthy;
  const secondary = all.filter((p) => p.id !== primary.id).filter(
    (p) => p.kind === "secondary_finding" || p.kind === "risk_context"
  ).slice(0, 5);
  return { primary, secondary };
}
function buildReportUIStructure(primary, _secondary, facts) {
  const isPartial = primary.id === "partial_credit_only" || primary.id === "partial_bank_only" || primary.id === "insufficient_data";
  const sectionOrder = isPartial ? primary.recommendedSections : FINAL_REPORT_SECTION_ORDER;
  return {
    sectionOrder,
    titles: {
      work_done: "\u05E2\u05D1\u05E8\u05E0\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7\u05D5\u05EA \u05D1\u05E9\u05D1\u05D9\u05DC\u05DB\u05DD",
      bottom_line: "\u05D4\u05E9\u05D5\u05E8\u05D4 \u05D4\u05EA\u05D7\u05EA\u05D5\u05E0\u05D4 \u05E9\u05DC\u05DB\u05DD",
      meaning: primary.ui.meaningTitle,
      scenario_comparison: "\u05E9\u05E0\u05D9 \u05EA\u05E8\u05D7\u05D9\u05E9\u05D9\u05DD",
      check_first: "\u05DE\u05D4 \u05DC\u05D1\u05D3\u05D5\u05E7 \u05E7\u05D5\u05D3\u05DD",
      control_opportunities: "\u05D0\u05D9\u05E4\u05D4 \u05D9\u05E9 \u05DC\u05DB\u05DD \u05E9\u05DC\u05D9\u05D8\u05D4",
      details_by_area: "\u05E4\u05D9\u05E8\u05D5\u05D8 \u05DC\u05E4\u05D9 \u05EA\u05D7\u05D5\u05DE\u05D9\u05DD",
      classify_later: "\u05D3\u05D1\u05E8\u05D9\u05DD \u05E9\u05DB\u05D3\u05D0\u05D9 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D4\u05DE\u05E9\u05DA",
      audit_trail: "\u05D0\u05D9\u05DA \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D3\u05D5\u05D7",
      export: "\u05E8\u05D5\u05E6\u05D9\u05DD \u05DC\u05E2\u05E7\u05D5\u05D1 \u05D0\u05D7\u05E8\u05D9 \u05D6\u05D4?"
    },
    subtitles: {
      work_done: "\u05D1\u05DE\u05E7\u05D5\u05DD \u05E9\u05EA\u05E2\u05D1\u05E8\u05D5 \u05D9\u05D3\u05E0\u05D9\u05EA \u05E2\u05DC \u05DE\u05D0\u05D5\u05EA \u05EA\u05E0\u05D5\u05E2\u05D5\u05EA, \u05E1\u05D9\u05D3\u05E8\u05E0\u05D5 \u05D0\u05EA \u05D4\u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05DC\u05E4\u05D9 \u05DE\u05D4 \u05E9\u05D1\u05D0\u05DE\u05EA \u05DE\u05E9\u05E0\u05D4.",
      bottom_line: primary.ui.bottomLineHeadline,
      meaning: primary.ui.meaningBody,
      scenario_comparison: facts.hasMaterialVariableIncome ? "\u05DB\u05E9\u05D9\u05E9 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05E9\u05EA\u05E0\u05D4, \u05DC\u05D0 \u05DE\u05E6\u05D9\u05D2\u05D9\u05DD \u05DE\u05E1\u05E4\u05E8 \u05D0\u05D7\u05D3 \u05E9\u05DE\u05D8\u05E2\u05D4." : "",
      check_first: "\u05DC\u05D0 \u05E8\u05E9\u05D9\u05DE\u05EA \u05E7\u05D9\u05E6\u05D5\u05E6\u05D9\u05DD. \u05E1\u05D3\u05E8 \u05E4\u05E2\u05D5\u05DC\u05D5\u05EA \u05DC\u05E4\u05D9 \u05DE\u05D4 \u05E9\u05DE\u05E9\u05E4\u05D9\u05E2 \u05E2\u05DC \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4.",
      control_opportunities: "\u05E8\u05E7 \u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05E9\u05D9\u05E9 \u05DC\u05DB\u05DD \u05E9\u05DC\u05D9\u05D8\u05D4 \u05E2\u05DC\u05D9\u05D4\u05DD. \u05DC\u05D0 \u05D4\u05EA\u05D7\u05D9\u05D9\u05D1\u05D5\u05D9\u05D5\u05EA \u05E7\u05D1\u05D5\u05E2\u05D5\u05EA.",
      details_by_area: "\u05DC\u05DE\u05D9 \u05E9\u05E8\u05D5\u05E6\u05D4 \u05DC\u05D4\u05D1\u05D9\u05DF \u05D0\u05EA \u05D4\u05DE\u05E1\u05E4\u05E8\u05D9\u05DD \u05D5\u05D4\u05E8\u05D0\u05D9\u05D5\u05EA \u05DE\u05D0\u05D7\u05D5\u05E8\u05D9 \u05D4\u05D0\u05D1\u05D7\u05D5\u05DF.",
      classify_later: "\u05DC\u05D0 \u05E2\u05E6\u05E8\u05E0\u05D5 \u05D1\u05E9\u05D1\u05D9\u05DC\u05DD \u05D0\u05EA \u05D4\u05D3\u05D5\u05D7, \u05D0\u05D1\u05DC \u05D4\u05DD \u05D9\u05E2\u05D6\u05E8\u05D5 \u05DC\u05D3\u05D9\u05D9\u05E7 \u05D0\u05EA \u05D4\u05D7\u05D5\u05D3\u05E9 \u05D4\u05D1\u05D0.",
      audit_trail: "\u05DC\u05DE\u05D9 \u05E9\u05E8\u05D5\u05E6\u05D4 \u05DC\u05E8\u05D0\u05D5\u05EA \u05D0\u05D9\u05DA \u05D4\u05EA\u05E9\u05D5\u05D1\u05D5\u05EA \u05D5\u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D4\u05E9\u05E4\u05D9\u05E2\u05D5 \u05E2\u05DC \u05D4\u05D7\u05D9\u05E9\u05D5\u05D1.",
      export: "\u05D9\u05D9\u05E6\u05D5\u05D0 \u05D4\u05D3\u05D5\u05D7, \u05D4\u05E1\u05D9\u05D5\u05D5\u05D2\u05D9\u05DD \u05D5\u05D4\u05D3\u05D1\u05E8\u05D9\u05DD \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4."
    }
  };
}

// supabase/functions/super-service/build_report_model.ts
var VARIABLE_MATERIAL_RATIO = 0.1;
var BALANCED_GAP_TOLERANCE = 200;
var SUBSCRIPTION_REVIEW_MIN = 100;
var FLEXIBLE_CONTROL_MIN = 1e3;
var NON_BLOCKING_TOP_N = 10;
function rowRef2(row) {
  return `${row.source}:${row.file_id}:${row.row_index}`;
}
function groupByVendor(rows) {
  const groups = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const key = normalizeDesc(r.raw_description);
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  const out = [];
  for (const [key, arr] of groups) {
    const months = new Set(arr.map((r) => monthOf(r)));
    out.push({
      key,
      label: arr[0].cleaned_name || arr[0].raw_description,
      category: inferCategoryLabel(arr[0]),
      rows: arr,
      total: arr.reduce((s, r) => s + Math.abs(r.amount), 0),
      months_present: Array.from(months).sort()
    });
  }
  out.sort((a, b) => b.total - a.total);
  return out;
}
function inferCategoryLabel(row) {
  const d = normalizeDesc(row.raw_description);
  if (/חשמל|מים|גז|בזק|הוט|yes|סלקום|פרטנר|פלאפון|012|013|014/i.test(d)) return "\u05D7\u05E9\u05D1\u05D5\u05E0\u05D5\u05EA";
  if (/ארנונה|ועד בית/.test(d)) return "\u05D3\u05D9\u05D5\u05E8";
  if (/משכנת/.test(d)) return "\u05D3\u05D9\u05D5\u05E8";
  if (/הלוואה|החזר|ריבית|loan/i.test(d)) return "\u05D7\u05D5\u05D1";
  if (/ביטוח|הראל|כלל|הפניקס|מנורה|מגדל ביטוח/.test(d)) return "\u05D1\u05D9\u05D8\u05D5\u05D7\u05D9\u05DD";
  if (/wolt|מסעדה|cafe|קפה|10bis|תן ביס/i.test(d)) return "\u05DE\u05D6\u05D5\u05DF \u05D1\u05D7\u05D5\u05E5";
  if (/שופרסל|רמי לוי|ויקטורי|מגה|טיב טעם|אושר עד|יוחננוף|סופר/i.test(d)) return "\u05DE\u05D6\u05D5\u05DF";
  if (/דלק|פז|דור אלון|סונול|paz|delek/i.test(d)) return "\u05EA\u05D7\u05D1\u05D5\u05E8\u05D4";
  if (/חוג|גן|צהרון|מטפלת|בית ספר|playsmart/i.test(d)) return "\u05D9\u05DC\u05D3\u05D9\u05DD";
  if (/מכבי|כללית|לאומית|מאוחדת|דנט|פארם|בית מרקחת|רופא/.test(d)) return "\u05E8\u05E4\u05D5\u05D0\u05D9";
  if (/netflix|spotify|icloud|apple|nyt|disney|hbo/i.test(d)) return "\u05DE\u05E0\u05D5\u05D9\u05D9\u05DD";
  if (/bit|paybox|paypal/i.test(d)) return "\u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4";
  return "\u05D0\u05D7\u05E8";
}
function filterByDecision(classification, decision, rowByRef) {
  const out = [];
  for (const d of classification.decisions) {
    if (d.decision !== decision) continue;
    const r = rowByRef.get(d.row_ref);
    if (r) out.push(r);
  }
  return out;
}
function buildRowByRef(rows) {
  const m = /* @__PURE__ */ new Map();
  for (const r of rows) m.set(rowRef2(r), r);
  return m;
}
function aggregateFixedIncome(rows, months) {
  const groups = groupByVendor(rows);
  return groups.map((g) => ({
    label: g.label,
    monthly_amount: months > 0 ? Math.round(g.total / months) : 0,
    evidence_count: g.rows.length,
    source_examples: g.rows.slice(0, 3).map((r) => r.raw_description)
  }));
}
function aggregateVariableIncome(rows) {
  const groups = groupByVendor(rows);
  return groups.map((g) => {
    const amts = g.rows.map((r) => r.amount);
    const min = Math.min(...amts);
    const max = Math.max(...amts);
    const avg = amts.reduce((s, x) => s + x, 0) / amts.length;
    return {
      label: g.label,
      months_present: g.months_present.length,
      range: { min: Math.round(min), max: Math.round(max), avg: Math.round(avg) },
      evidence: g.rows.map((r) => ({ date: r.date, amount: r.amount }))
    };
  });
}
function aggregateOneTimeIncome(rows) {
  return rows.map((r) => ({
    label: r.cleaned_name || r.raw_description,
    amount: Math.round(r.amount),
    date: r.date,
    reason: "\u05E1\u05D5\u05D5\u05D2 \u05DB\u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9 (\u05E7\u05E8\u05DF/\u05D2\u05DE\u05DC/\u05E4\u05D9\u05E6\u05D5\u05D9\u05D9\u05DD)"
  }));
}
function aggregateInternalTransfers(rows) {
  const groups = groupByVendor(rows);
  return groups.map((g) => ({
    label: g.label,
    amount: Math.round(g.total),
    count: g.rows.length
  }));
}
function aggregateFixedCommitments(rows, months) {
  const groups = groupByVendor(rows);
  return groups.map((g) => ({
    label: g.label,
    monthly_amount: months > 0 ? Math.round(g.total / months) : 0,
    category: g.category,
    occurrences: g.rows.length,
    months_present: g.months_present.length,
    evidence: g.rows.slice(0, 3).map((r) => ({ date: r.date, amount: r.amount }))
  }));
}
function aggregateDebt(rows, months) {
  const groups = groupByVendor(rows);
  return groups.map((g) => ({
    label: g.label,
    monthly_amount: months > 0 ? Math.round(g.total / months) : 0,
    occurrences: g.rows.length,
    months_present: g.months_present.length,
    evidence: g.rows.slice(0, 3).map((r) => ({ date: r.date, amount: r.amount }))
  }));
}
function aggregateFlexible(rows, months) {
  const groups = groupByVendor(rows);
  return groups.map((g) => ({
    label: g.label,
    monthly_avg: months > 0 ? Math.round(g.total / months) : 0,
    category: g.category,
    occurrences: g.rows.length,
    months_present: g.months_present.length,
    evidence: g.rows.slice(0, 3).map((r) => ({ date: r.date, amount: r.amount }))
  }));
}
function aggregateReviewOnly(rows, months) {
  const groups = groupByVendor(rows);
  return groups.map((g) => {
    const isRecurring = g.months_present.length >= 2;
    const common = {
      occurrences: g.rows.length,
      months_present: g.months_present.length,
      evidence: g.rows.slice(0, 3).map((r) => ({ date: r.date, amount: r.amount }))
    };
    if (isRecurring) {
      return {
        label: g.label,
        monthly_avg: months > 0 ? Math.round(g.total / months) : 0,
        reason: "\u05DC\u05D1\u05D3\u05D5\u05E7 \u05D0\u05DD \u05D4\u05D4\u05D5\u05E6\u05D0\u05D4 \u05DE\u05D5\u05E6\u05D3\u05E7\u05EA \u05D7\u05D5\u05D3\u05E9\u05D9\u05EA",
        ...common
      };
    }
    return {
      label: g.label,
      period_total: Math.round(g.total),
      reason: "\u05EA\u05E0\u05D5\u05E2\u05D5\u05EA \u05E9\u05D3\u05D5\u05E8\u05E9\u05D5\u05EA \u05E1\u05E7\u05D9\u05E8\u05D4 \u2014 \u05DC\u05D0 \u05E1\u05D5\u05D5\u05D2\u05D5 \u05D0\u05D5\u05D8\u05D5\u05DE\u05D8\u05D9\u05EA",
      ...common
    };
  });
}
function aggregateOneTimeExpenses(rows) {
  return rows.map((r) => ({
    label: r.cleaned_name || r.raw_description,
    amount: Math.round(Math.abs(r.amount)),
    date: r.date,
    category: inferCategoryLabel(r)
  }));
}
function aggregateNonBlocking(rows) {
  return rows.slice().sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, NON_BLOCKING_TOP_N).map((r) => ({
    label: r.cleaned_name || r.raw_description,
    amount: Math.round(Math.abs(r.amount)),
    date: r.date,
    suggested_category: inferCategoryLabel(r),
    action: "confirm"
  }));
}
function aggregateExcludedCcTransfers(classification, rowByRef) {
  const grouped = /* @__PURE__ */ new Map();
  for (const d of classification.decisions) {
    if (d.decision !== "cc_charge_in_bank") continue;
    const row = rowByRef.get(d.row_ref);
    if (!row) continue;
    const key = normalizeDesc(row.raw_description);
    const prev = grouped.get(key) ?? { amount: 0, count: 0, sample: row };
    prev.amount += Math.abs(row.amount);
    prev.count += 1;
    grouped.set(key, prev);
  }
  return Array.from(grouped.values()).map((g) => ({
    label: g.sample.cleaned_name || g.sample.raw_description,
    amount: Math.round(g.amount),
    count: g.count,
    target: "\u05DB\u05E8\u05D8\u05D9\u05E1 \u05D0\u05E9\u05E8\u05D0\u05D9"
  }));
}
function determineSummaryStatus(monthlyIncomeFixed, monthlyIncomeVariable, monthlyExpenses) {
  if (monthlyIncomeFixed === 0 && !monthlyIncomeVariable) return "insufficient_data";
  const variableAvg = monthlyIncomeVariable?.avg ?? 0;
  const variableMaterial = !!monthlyIncomeVariable && (variableAvg > monthlyIncomeFixed * VARIABLE_MATERIAL_RATIO || monthlyIncomeFixed < monthlyExpenses);
  if (variableMaterial) return "variable_dependent";
  const gap = monthlyIncomeFixed - monthlyExpenses;
  if (Math.abs(gap) <= BALANCED_GAP_TOLERANCE) return "balanced";
  return gap > 0 ? "surplus" : "deficit";
}
function gapLabelFor(status) {
  if (status === "surplus" || status === "variable_dependent") return "\u05E2\u05D5\u05D3\u05E3 \u05DE\u05D7\u05D5\u05E9\u05D1";
  if (status === "deficit") return "\u05D7\u05D5\u05E1\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9";
  return "\u05DE\u05D0\u05D5\u05D6\u05DF";
}
function buildScenarios(monthlyIncomeFixed, variable, monthlyExpenses) {
  if (!variable) return void 0;
  const variableAvg = variable.avg ?? 0;
  return [
    {
      name: "\u05DC\u05DC\u05D0 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05E9\u05EA\u05E0\u05D4",
      income: monthlyIncomeFixed,
      expenses: monthlyExpenses,
      gap: monthlyIncomeFixed - monthlyExpenses
    },
    {
      name: "\u05E2\u05DD \u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05E9\u05EA\u05E0\u05D4",
      income: monthlyIncomeFixed + variableAvg,
      expenses: monthlyExpenses,
      gap: monthlyIncomeFixed + variableAvg - monthlyExpenses
    }
  ];
}
function buildPriorityChecks(income, expenseModel, context) {
  const checks = [];
  if (income.length > 0) {
    const v = income[0];
    checks.push({
      id: "pc-variable-income",
      title: `\u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 ${context.partner_name ? `\u05DE${context.partner_name} ` : ""}\u05DC\u05D0 \u05E7\u05D1\u05D5\u05E2\u05D4`,
      why_it_matters: `\u05D4\u05E1\u05DB\u05D5\u05DE\u05D9\u05DD \u05E0\u05E2\u05D9\u05DD \u05D1\u05D9\u05DF ${formatILS2(v.range.min)} \u05DC-${formatILS2(v.range.max)} \u05D1\u05D7\u05D5\u05D3\u05E9\u05D9\u05DD \u05E9\u05D1\u05D4\u05DD \u05D4\u05D5\u05E4\u05D9\u05E2\u05D4.`,
      suggested_action: "\u05D0\u05DD \u05D6\u05D4 \u05EA\u05D6\u05E8\u05D9\u05DD \u05D9\u05E6\u05D9\u05D1 \u05DC\u05D8\u05D5\u05D5\u05D7 \u05D0\u05E8\u05D5\u05DA \u2014 \u05DC\u05EA\u05DB\u05E0\u05DF \u05E1\u05D1\u05D9\u05D1\u05D5. \u05D0\u05DD \u05DC\u05D0 \u2014 \u05DC\u05D1\u05E0\u05D5\u05EA \u05EA\u05E7\u05E6\u05D9\u05D1 \u05DC\u05E4\u05D9 \u05EA\u05E8\u05D7\u05D9\u05E9 \u05D4\u05D6\u05D4\u05D9\u05E8.",
      amount_context: `${formatILS2(v.range.min)}-${formatILS2(v.range.max)}`,
      copy_blurb: ""
    });
  }
  const bitPaybox = expenseModel.review_only_items.filter(
    (x) => /bit|paybox|paypal/i.test(x.label)
  );
  if (bitPaybox.length > 0) {
    const total = bitPaybox.reduce((s, x) => s + (x.monthly_avg ?? x.period_total ?? 0), 0);
    if (total >= 500) {
      checks.push({
        id: "pc-bit-paybox",
        title: "\u05D4\u05E2\u05D1\u05E8\u05D5\u05EA BIT/PayBox \u05DC\u05D0 \u05DE\u05D6\u05D5\u05D4\u05D5\u05EA",
        why_it_matters: `\u05DE\u05E6\u05D0\u05E0\u05D5 ${formatILS2(total)} \u05E9\u05DC\u05D0 \u05D1\u05E8\u05D5\u05E8 \u05DC\u05D0\u05DF \u05D4\u05DC\u05DB\u05D5. \u05E9\u05D5\u05D5\u05D4 \u05DC\u05E4\u05E8\u05E7 \u05DC\u05E4\u05E0\u05D9 \u05E9\u05DE\u05E1\u05D9\u05E7\u05D9\u05DD \u05E2\u05DC \u05D4\u05E4\u05E2\u05E8.`,
        suggested_action: "\u05DC\u05E2\u05D1\u05D5\u05E8 \u05E2\u05DC \u05D4\u05D0\u05E4\u05DC\u05D9\u05E7\u05E6\u05D9\u05D4 \u05D5\u05DC\u05E1\u05DE\u05DF \u05D0\u05EA \u05D4\u05E0\u05DE\u05E2\u05E0\u05D9\u05DD \u05D4\u05E7\u05D1\u05D5\u05E2\u05D9\u05DD.",
        amount_context: formatILS2(total),
        copy_blurb: ""
      });
    }
  }
  const subs = expenseModel.review_only_items.filter(
    (x) => /netflix|spotify|icloud|apple|disney|hbo|מנוי/i.test(x.label)
  );
  if (subs.length > 0) {
    const total = subs.reduce((s, x) => s + (x.monthly_avg ?? 0), 0);
    if (total >= SUBSCRIPTION_REVIEW_MIN) {
      checks.push({
        id: "pc-subscriptions",
        title: "\u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05E9\u05DC\u05D0 \u05E0\u05D1\u05D3\u05E7\u05D5",
        why_it_matters: `${formatILS2(total)}/\u05D7\u05D5\u05D3\u05E9 \u05DC\u05DE\u05E0\u05D5\u05D9\u05D9\u05DD. \u05D4\u05E4\u05D5\u05D8\u05E0\u05E6\u05D9\u05D0\u05DC \u05EA\u05DC\u05D5\u05D9 \u05D1\u05DE\u05D4 \u05E9\u05D1\u05D0\u05DE\u05EA \u05D1\u05E9\u05D9\u05DE\u05D5\u05E9.`,
        suggested_action: "\u05DC\u05E2\u05D1\u05D5\u05E8 \u05E2\u05DC \u05D4\u05E8\u05E9\u05D9\u05DE\u05D4 \u05D5\u05DC\u05E1\u05DE\u05DF \u05D0\u05D9\u05DC\u05D5 \u05E4\u05E2\u05D9\u05DC\u05D9\u05DD.",
        amount_context: `${formatILS2(total)}/\u05D7\u05D5\u05D3\u05E9`,
        copy_blurb: ""
      });
    }
  }
  return checks.slice(0, 5);
}
function buildImprovements(expenseModel) {
  const out = [];
  for (const f of expenseModel.flexible_spending) {
    if (f.monthly_avg < FLEXIBLE_CONTROL_MIN) continue;
    out.push({
      id: `io-${normalizeDesc(f.label).replace(/\s+/g, "-")}`,
      title: f.label,
      evidence_strength: "likely",
      amount_label: `${formatILS2(f.monthly_avg)}/\u05D7\u05D5\u05D3\u05E9`,
      copy_blurb: ""
    });
  }
  return out.slice(0, 5);
}
function buildFindingsByArea(expenseModel) {
  const byArea = /* @__PURE__ */ new Map();
  const add = (area, amount, strength) => {
    const prev = byArea.get(area) ?? { monthly: 0, items: 0, strength };
    prev.monthly += amount;
    prev.items += 1;
    if (strength === "review_only") prev.strength = "review_only";
    else if (strength === "likely" && prev.strength !== "review_only") prev.strength = "likely";
    byArea.set(area, prev);
  };
  for (const f of expenseModel.fixed_commitments) add(f.category, f.monthly_amount, "confirmed");
  for (const f of expenseModel.flexible_spending) add(f.category, f.monthly_avg, "confirmed");
  for (const d of expenseModel.debt_payments) add("\u05D7\u05D5\u05D1", d.monthly_amount, "confirmed");
  for (const r of expenseModel.review_only_items) {
    const amt = r.monthly_avg ?? 0;
    if (amt > 0) add(/bit|paybox/i.test(r.label) ? "\u05D4\u05E2\u05D1\u05E8\u05D5\u05EA \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4" : "\u05DE\u05E0\u05D5\u05D9\u05D9\u05DD", amt, "review_only");
  }
  return Array.from(byArea.entries()).map(([area, x]) => ({
    area,
    monthly_avg: Math.round(x.monthly),
    items: x.items,
    evidence_strength: x.strength
  })).sort((a, b) => b.monthly_avg - a.monthly_avg);
}
function determineReportType(facts) {
  const hasBank = facts.files_present.bank;
  const hasCc = facts.files_present.credit_card;
  const months = facts.months_covered.length;
  if (!hasBank && !hasCc) return "low_confidence";
  if (months < 1) return "low_confidence";
  if (hasBank && !hasCc) return "partial_bank_only";
  if (!hasBank && hasCc) return "partial_credit_only";
  return "full";
}
function determineConfidence(facts) {
  const hasBank = facts.files_present.bank;
  const hasCc = facts.files_present.credit_card;
  const months = facts.months_covered.length;
  if (hasBank && hasCc && months >= 3) return { level: "high", reason: "\u05E2\u05D5\u05F4\u05E9 + \u05D0\u05E9\u05E8\u05D0\u05D9 + 3 \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD \u05D0\u05D5 \u05D9\u05D5\u05EA\u05E8" };
  if (hasBank && hasCc && months >= 1) return { level: "medium", reason: "\u05E2\u05D5\u05F4\u05E9 + \u05D0\u05E9\u05E8\u05D0\u05D9 \u05D0\u05D1\u05DC \u05E4\u05D7\u05D5\u05EA \u05DE-3 \u05D7\u05D5\u05D3\u05E9\u05D9\u05DD" };
  if ((hasBank || hasCc) && months >= 1) return { level: "medium", reason: "\u05D7\u05E1\u05E8 \u05D7\u05DC\u05E7 \u05DE\u05D4\u05E7\u05D1\u05E6\u05D9\u05DD" };
  return { level: "low", reason: "\u05DE\u05E2\u05D8 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05D6\u05DE\u05D9\u05E0\u05D9\u05DD" };
}
function formatILS2(n) {
  return "\u20AA" + Math.round(Math.abs(n)).toLocaleString("he-IL");
}
function sumMonthly(items) {
  return items.reduce((s, i) => s + (i.monthly_amount ?? i.monthly_avg ?? 0), 0);
}
function buildReportModel(facts, classification, _answers, overrides) {
  const rowByRef = buildRowByRef(facts.rows);
  const months = facts.months_covered.length || 1;
  const fixedIncomeRows = filterByDecision(classification, "fixed_income", rowByRef);
  const variableIncomeRows = filterByDecision(classification, "variable_income", rowByRef);
  const oneTimeIncomeRows = filterByDecision(classification, "one_time_income_excluded", rowByRef);
  const internalIncomeRows = filterByDecision(classification, "internal_transfer_excluded", rowByRef);
  const uncertainIncomeRows = filterByDecision(classification, "uncertain_income", rowByRef);
  const fixedIncome = aggregateFixedIncome(fixedIncomeRows, months);
  const variableIncome = aggregateVariableIncome(variableIncomeRows);
  const oneTimeIncome = aggregateOneTimeIncome(oneTimeIncomeRows);
  const internalTransfersIncome = aggregateInternalTransfers(internalIncomeRows);
  const uncertain = uncertainIncomeRows.map((r) => ({
    label: r.cleaned_name || r.raw_description,
    amount: Math.round(r.amount),
    why: "\u05DC\u05D0 \u05D4\u05E6\u05DC\u05D7\u05E0\u05D5 \u05DC\u05E1\u05D5\u05D5\u05D2 \u05D1\u05D5\u05D5\u05D3\u05D0\u05D5\u05EA"
  }));
  const fixedCommitmentRows = [
    ...filterByDecision(classification, "fixed_commitment", rowByRef),
    ...filterByDecision(classification, "household_bill", rowByRef)
  ];
  const debtRows = filterByDecision(classification, "debt_payment", rowByRef);
  const flexibleRows = filterByDecision(classification, "flexible_spending", rowByRef);
  const reviewOnlyRows = filterByDecision(classification, "review_only", rowByRef);
  const oneTimeExpRows = filterByDecision(classification, "one_time_expense", rowByRef);
  const nonBlockingRows = filterByDecision(classification, "non_blocking_item", rowByRef);
  const fixedCommitments = aggregateFixedCommitments(fixedCommitmentRows, months);
  const debtPayments = aggregateDebt(debtRows, months);
  const flexibleSpending = aggregateFlexible(flexibleRows, months);
  const reviewOnlyItems = aggregateReviewOnly(reviewOnlyRows, months);
  const oneTimeExpenses = aggregateOneTimeExpenses(oneTimeExpRows);
  const nonBlockingItems = aggregateNonBlocking(nonBlockingRows);
  const excludedCcTransfers = aggregateExcludedCcTransfers(classification, rowByRef);
  const monthlyIncomeFixed = sumMonthly(fixedIncome.map((x) => ({ monthly_amount: x.monthly_amount })));
  const monthlyExpensesTotal = sumMonthly(fixedCommitments.map((x) => ({ monthly_amount: x.monthly_amount }))) + sumMonthly(debtPayments.map((x) => ({ monthly_amount: x.monthly_amount }))) + sumMonthly(flexibleSpending.map((x) => ({ monthly_avg: x.monthly_avg })));
  const variableRange = variableIncome.length > 0 ? {
    min: Math.min(...variableIncome.map((v) => v.range.min)),
    max: Math.max(...variableIncome.map((v) => v.range.max)),
    avg: Math.round(variableIncome.reduce((s, v) => s + v.range.avg, 0) / variableIncome.length),
    months_present: Math.max(...variableIncome.map((v) => v.months_present))
  } : null;
  const summary_status = determineSummaryStatus(monthlyIncomeFixed, variableRange, monthlyExpensesTotal);
  const display_mode = summary_status === "variable_dependent" ? "two_scenarios" : "single_scenario";
  const monthlyGap = summary_status === "variable_dependent" ? monthlyIncomeFixed - monthlyExpensesTotal : monthlyIncomeFixed - monthlyExpensesTotal;
  const scenarios = display_mode === "two_scenarios" ? buildScenarios(monthlyIncomeFixed, variableRange, monthlyExpensesTotal) : void 0;
  const report_type = determineReportType(facts);
  const conf = determineConfidence(facts);
  const expense_model = {
    fixed_commitments: fixedCommitments,
    debt_payments: debtPayments,
    flexible_spending: flexibleSpending,
    review_only_items: reviewOnlyItems,
    one_time_expenses: oneTimeExpenses,
    excluded_internal_transfers: excludedCcTransfers
  };
  const priority_checks = buildPriorityChecks(variableIncome, expense_model, facts.context);
  const improvement_opportunities = buildImprovements(expense_model);
  const findings_by_area = buildFindingsByArea(expense_model);
  const filesAnalyzed = collectFilesAnalyzed(facts.rows);
  const ccDedupCount = classification.decisions.filter((d) => d.decision === "cc_charge_in_bank").length;
  const oneTimeExcludedCount = oneTimeIncome.length + oneTimeExpenses.length;
  const work_done = {
    files_analyzed: filesAnalyzed,
    months_covered: facts.months_covered.length,
    transactions_reviewed: facts.rows.length,
    cc_charges_deduplicated: ccDedupCount,
    one_time_items_excluded: oneTimeExcludedCount,
    bullets_copy: []
    // filled by Claude in Stage F, fallback in copy_writer
  };
  const classification_audit_trail = {
    rules_fired: classification.decisions.map((d) => ({
      rule_id: d.rule_id,
      row_ref: d.row_ref,
      decision: d.decision,
      confidence: d.confidence
    })),
    user_overrides: overrides,
    excluded_items: [
      ...classification.decisions.filter((d) => d.decision === "cc_charge_in_bank").map((d) => ({ row_ref: d.row_ref, reason: "\u05D7\u05D9\u05D5\u05D1 \u05E4\u05E0\u05D9\u05DE\u05D9 \u05E9\u05DC \u05D0\u05E9\u05E8\u05D0\u05D9 \u05D1\u05E2\u05D5\u05F4\u05E9" })),
      ...classification.decisions.filter((d) => d.decision === "one_time_income_excluded").map((d) => ({ row_ref: d.row_ref, reason: "\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05EA \u2014 \u05DC\u05D0 \u05E0\u05E1\u05E4\u05E8\u05EA \u05D7\u05D5\u05D3\u05E9\u05D9\u05EA" }))
    ]
  };
  const model = {
    report_type,
    data_confidence: conf.level,
    data_confidence_reason: conf.reason,
    summary_status,
    display_mode,
    summary: {
      headline_copy: "",
      meaning_copy: "",
      monthly_income_fixed: Math.round(monthlyIncomeFixed),
      monthly_income_variable_range: variableRange,
      monthly_expenses_total: Math.round(monthlyExpensesTotal),
      monthly_gap: Math.round(monthlyGap),
      gap_label: gapLabelFor(summary_status),
      scenarios
    },
    work_done,
    income_model: {
      fixed: fixedIncome,
      variable: variableIncome,
      one_time_excluded: oneTimeIncome,
      internal_transfers_excluded: internalTransfersIncome,
      uncertain
    },
    expense_model,
    priority_checks,
    improvement_opportunities,
    findings_by_area,
    non_blocking_items: nonBlockingItems,
    classification_audit_trail,
    export_data: { json_blob_ref: null, pdf_url: null, csv_url: null },
    parser_warnings: facts.parser_warnings,
    forbidden_word_violations: []
  };
  const playbookFacts = factsToPlaybookFacts(facts, model);
  const { primary, secondary } = selectPlaybooks(playbookFacts);
  const uiStructure = buildReportUIStructure(primary, secondary, playbookFacts);
  model.selected_playbooks = {
    primary: primary.id,
    secondary: secondary.map((p) => p.id)
  };
  model.ui_structure = {
    section_order: uiStructure.sectionOrder,
    titles: uiStructure.titles,
    subtitles: Object.fromEntries(
      Object.entries(uiStructure.subtitles).filter(([, v]) => typeof v === "string")
    )
  };
  assertAllInvariants(model);
  return model;
}
function collectFilesAnalyzed(rows) {
  const byFile = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const key = `${r.source}:${r.file_id}`;
    const prev = byFile.get(key) ?? { type: r.source, name: `${r.source}-${r.file_id}`, months: /* @__PURE__ */ new Set(), rows: 0 };
    prev.months.add(monthOf(r));
    prev.rows += 1;
    byFile.set(key, prev);
  }
  return Array.from(byFile.values()).map((f) => ({
    type: f.type,
    name: f.name,
    months: f.months.size,
    row_count: f.rows
  }));
}

// supabase/functions/super-service/validators/forbidden_words.ts
var FORBIDDEN_WORDS = [
  "\u05D1\u05D6\u05D1\u05D5\u05D6\u05D9\u05DD",
  "\u05D3\u05D5\u05E8\u05E9 \u05D8\u05D9\u05E4\u05D5\u05DC \u05DE\u05D9\u05D9\u05D3\u05D9",
  "\u05D7\u05DE\u05D5\u05E8",
  "\u05DE\u05E1\u05D5\u05DB\u05DF",
  "\u05D7\u05D9\u05D9\u05D1\u05D9\u05DD",
  "\u05DE\u05D5\u05DB\u05E8\u05D7\u05D9\u05DD",
  "\u05E7\u05D7\u05D5 \u05D4\u05DC\u05D5\u05D5\u05D0\u05D4",
  "\u05D8\u05E4\u05E9\u05D9",
  "\u05DC\u05D0 \u05D0\u05D7\u05E8\u05D0\u05D9",
  // The typo guard — past versions repeatedly produced "כעגע"
  // (intended "כרגע"). Any output containing this is rejected.
  "\u05DB\u05E2\u05D2\u05E2"
];
var FORBIDDEN_PHRASES = [
  /פי\s*\d+\s*מהממוצע/,
  // "פי X מהממוצע"
  /פוטנציאל\s+חיסכון\s+עד/
  // "פוטנציאל חיסכון עד ₪X" without evidence
];
var PER_MONTH_PATTERN = /\/\s*חודש|לחודש|בחודש/;
var GAP_WORD_PATTERN = /(?<![א-ת])פער(?![א-ת])/;
function validateCopy(text, field, opts = {}) {
  if (!text) return [];
  const violations = [];
  for (const word of FORBIDDEN_WORDS) {
    if (text.includes(word)) {
      violations.push({ field, reason: `forbidden word: "${word}"`, found: word });
    }
  }
  for (const re of FORBIDDEN_PHRASES) {
    const m = text.match(re);
    if (m) {
      violations.push({ field, reason: `forbidden phrase: ${re}`, found: m[0] });
    }
  }
  if (GAP_WORD_PATTERN.test(text)) {
    violations.push({ field, reason: 'forbidden gap word "\u05E4\u05E2\u05E8"', found: "\u05E4\u05E2\u05E8" });
  }
  if (opts.isOneTime && PER_MONTH_PATTERN.test(text)) {
    const m = text.match(PER_MONTH_PATTERN);
    violations.push({
      field,
      reason: '"/\u05D7\u05D5\u05D3\u05E9" on a one-time item',
      found: m ? m[0] : "/\u05D7\u05D5\u05D3\u05E9"
    });
  }
  return violations;
}
function validateClaudeCopy(copy) {
  const out = [];
  if (copy.headline_copy) out.push(...validateCopy(copy.headline_copy, "headline_copy"));
  if (copy.meaning_copy) out.push(...validateCopy(copy.meaning_copy, "meaning_copy"));
  (copy.work_done_bullets ?? []).forEach(
    (b, i) => out.push(...validateCopy(b, `work_done_bullets[${i}]`))
  );
  (copy.priority_check_blurbs ?? []).forEach(
    (p) => out.push(...validateCopy(p.copy_blurb, `priority_check_blurbs[${p.id}]`))
  );
  (copy.improvement_blurbs ?? []).forEach(
    (p) => out.push(...validateCopy(p.copy_blurb, `improvement_blurbs[${p.id}]`))
  );
  return out;
}

// supabase/functions/super-service/prompt.ts
var CLAUDE_MODEL = "claude-sonnet-4-5-20250929";
var SYSTEM_PROMPT = `\u05D0\u05EA\u05D4 \u05DB\u05D5\u05EA\u05D1 \u05E7\u05D5\u05E4\u05D9 \u05E7\u05E6\u05E8 \u05D1\u05E2\u05D1\u05E8\u05D9\u05EA \u05E2\u05D1\u05D5\u05E8 "\u05E9\u05D5\u05E8\u05D4 \u05EA\u05D7\u05EA\u05D5\u05E0\u05D4" \u2014 \u05D1\u05D3\u05D9\u05E7\u05D4 \u05E4\u05D9\u05E0\u05E0\u05E1\u05D9\u05EA \u05E2\u05DC \u05EA\u05D3\u05E4\u05D9\u05E1\u05D9 \u05D1\u05E0\u05E7 \u05D5\u05DB\u05E8\u05D8\u05D9\u05E1\u05D9 \u05D0\u05E9\u05E8\u05D0\u05D9 \u05D9\u05E9\u05E8\u05D0\u05DC\u05D9\u05D9\u05DD.

\u05EA\u05E4\u05E7\u05D9\u05D3\u05DA:
\u05D9\u05E0\u05EA\u05DF \u05DC\u05DA \u05D0\u05D5\u05D1\u05D9\u05D9\u05E7\u05D8 ReportModel \u05DE\u05DC\u05D0 \u05D5\u05DE\u05D7\u05D5\u05E9\u05D1. \u05D0\u05EA\u05D4 \u05DB\u05D5\u05EA\u05D1 \u05D8\u05E7\u05E1\u05D8\u05D9\u05DD \u05E7\u05E6\u05E8\u05D9\u05DD \u05D1\u05E9\u05D3\u05D5\u05EA \u05DE\u05D5\u05D2\u05D3\u05E8\u05D9\u05DD \u05DE\u05E8\u05D0\u05E9. \u05D0\u05E1\u05D5\u05E8 \u05DC\u05DA \u05DC\u05D7\u05E9\u05D1, \u05DC\u05E1\u05D5\u05D5\u05D2, \u05DC\u05D4\u05DE\u05E6\u05D9\u05D0 \u05DE\u05E1\u05E4\u05E8\u05D9\u05DD, \u05D0\u05D5 \u05DC\u05E1\u05EA\u05D5\u05E8 \u05D0\u05EA \u05D4\u05DE\u05D5\u05D3\u05DC.

\u05D7\u05D5\u05E7\u05D9\u05DD \u05E0\u05D5\u05E7\u05E9\u05D9\u05DD:
1. \u05D4\u05D7\u05D6\u05E8 JSON \u05EA\u05E7\u05D9\u05DF \u05D1\u05E4\u05D5\u05E8\u05DE\u05D8 \u05D4\u05DE\u05D3\u05D5\u05D9\u05E7 \u05E9\u05DE\u05EA\u05D1\u05E7\u05E9 \u05DC\u05DE\u05D8\u05D4. \u05D1\u05DC\u05D9 \u05D8\u05E7\u05E1\u05D8 \u05DE\u05E1\u05D1\u05D9\u05D1.
2. \u05D0\u05E1\u05D5\u05E8 \u05DC\u05D4\u05DE\u05E6\u05D9\u05D0 \u05DE\u05E1\u05E4\u05E8\u05D9\u05DD. \u05DB\u05DC \u05DE\u05E1\u05E4\u05E8 \u05D7\u05D9\u05D9\u05D1 \u05DC\u05D4\u05D5\u05E4\u05D9\u05E2 \u05D1-ReportModel \u05E9\u05E7\u05D9\u05D1\u05DC\u05EA.
3. \u05D0\u05E1\u05D5\u05E8 \u05DC\u05D4\u05DE\u05E6\u05D9\u05D0 \u05E1\u05E4\u05E7\u05D9\u05DD, \u05EA\u05D0\u05E8\u05D9\u05DB\u05D9\u05DD, \u05D0\u05D5 \u05E2\u05D5\u05D1\u05D3\u05D5\u05EA.
4. \u05D0\u05E1\u05D5\u05E8 \u05DC\u05D4\u05E9\u05EA\u05DE\u05E9 \u05D1\u05E4\u05E8\u05D9\u05D8 \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9 \u05E2\u05DD \u05EA\u05D5\u05D5\u05D9\u05D5\u05EA "/\u05D7\u05D5\u05D3\u05E9", "\u05DC\u05D7\u05D5\u05D3\u05E9" \u05D0\u05D5 "\u05D1\u05D7\u05D5\u05D3\u05E9".
5. \u05D0\u05E1\u05D5\u05E8 \u05DC\u05D4\u05E9\u05EA\u05DE\u05E9 \u05D1\u05DE\u05D9\u05DC\u05D9\u05DD: "\u05D1\u05D6\u05D1\u05D5\u05D6\u05D9\u05DD", "\u05D3\u05D5\u05E8\u05E9 \u05D8\u05D9\u05E4\u05D5\u05DC \u05DE\u05D9\u05D9\u05D3\u05D9", "\u05D7\u05DE\u05D5\u05E8", "\u05DE\u05E1\u05D5\u05DB\u05DF", "\u05D7\u05D9\u05D9\u05D1\u05D9\u05DD", "\u05DE\u05D5\u05DB\u05E8\u05D7\u05D9\u05DD", "\u05E7\u05D7\u05D5 \u05D4\u05DC\u05D5\u05D5\u05D0\u05D4", "\u05D8\u05E4\u05E9\u05D9", "\u05E4\u05E2\u05E8".
6. \u05DC\u05DE\u05E6\u05D1 \u05E2\u05D5\u05D3\u05E3: \u05D4\u05E9\u05EA\u05DE\u05E9 \u05D1"\u05E2\u05D5\u05D3\u05E3 \u05DE\u05D7\u05D5\u05E9\u05D1". \u05DC\u05DE\u05E6\u05D1 \u05D7\u05D5\u05E1\u05E8: "\u05D7\u05D5\u05E1\u05E8 \u05D7\u05D5\u05D3\u05E9\u05D9". \u05D1\u05DC\u05D9 \u05DE\u05D9\u05E0\u05D5\u05E1, \u05D1\u05DC\u05D9 \u05D0\u05D3\u05D5\u05DD.
7. \u05DC\u05DE\u05E6\u05D1 variable_dependent: \u05D4\u05EA\u05D9\u05D9\u05D7\u05E1 \u05D1\u05E7\u05E6\u05E8\u05D4 \u05DC\u05E9\u05E0\u05D9 \u05D4\u05EA\u05E8\u05D7\u05D9\u05E9\u05D9\u05DD \u05D1\u05DC\u05D9 \u05DC\u05E7\u05D1\u05D5\u05E2 \u05DE\u05D4 \u05D9\u05E7\u05E8\u05D4.

\u05D8\u05D5\u05DF:
- \u05E8\u05D2\u05D5\u05E2, \u05D7\u05DB\u05DD, \u05D0\u05E0\u05D5\u05E9\u05D9, \u05DE\u05E2\u05E9\u05D9.
- \u05D1\u05DC\u05D9 \u05E9\u05D9\u05E4\u05D5\u05D8, \u05D1\u05DC\u05D9 \u05D4\u05D8\u05E4\u05D4, \u05D1\u05DC\u05D9 \u05D3\u05E8\u05DE\u05D4.
- \u05D1\u05E2\u05D1\u05E8\u05D9\u05EA \u05D8\u05D1\u05E2\u05D9\u05EA, \u05DC\u05D0 \u05EA\u05E8\u05D2\u05D5\u05DD \u05DE\u05D0\u05E0\u05D2\u05DC\u05D9\u05EA.
- \u05D0\u05DC \u05EA\u05D6\u05DB\u05D9\u05E8 \u05D0\u05EA \u05E2\u05E6\u05DE\u05DA ("\u05D0\u05E0\u05D7\u05E0\u05D5 \u05E0\u05D9\u05EA\u05D7\u05E0\u05D5...") \u05D9\u05D5\u05EA\u05E8 \u05DE\u05E4\u05E2\u05DD \u05D0\u05D7\u05EA \u05D1\u05DB\u05DC \u05D4\u05D3\u05D5\u05D7.

\u05DE\u05D1\u05E0\u05D4 \u05EA\u05D2\u05D5\u05D1\u05EA JSON (\u05D7\u05D5\u05D1\u05D4):
{
  "headline_copy": string,           // \u05DE\u05E9\u05E4\u05D8 \u05D0\u05D7\u05D3 \u05E9\u05DE\u05E1\u05DB\u05DD \u05D0\u05EA \u05D4\u05E9\u05D5\u05E8\u05D4 \u05D4\u05EA\u05D7\u05EA\u05D5\u05E0\u05D4 (\u05DC\u05D0 \u05D9\u05D5\u05EA\u05E8 \u05DE-200 \u05EA\u05D5\u05D5\u05D9\u05DD)
  "meaning_copy": string,            // 2-3 \u05DE\u05E9\u05E4\u05D8\u05D9\u05DD \u05E9\u05DE\u05E1\u05D1\u05D9\u05E8\u05D9\u05DD \u05DE\u05D4 \u05D6\u05D4 \u05D0\u05D5\u05DE\u05E8 \u05D1\u05E4\u05D5\u05E2\u05DC
  "work_done_bullets": [string, ...], // 3-5 \u05D1\u05D5\u05DC\u05D8\u05D9\u05DD \u05E7\u05E6\u05E8\u05D9\u05DD \u05E9\u05DE\u05EA\u05D0\u05E8\u05D9\u05DD \u05DE\u05D4 \u05E2\u05E9\u05D9\u05E0\u05D5 (\u05DC\u05D0 \u05D9\u05D5\u05EA\u05E8 \u05DE-80 \u05EA\u05D5\u05D5\u05D9\u05DD \u05DB\u05DC \u05D0\u05D7\u05D3)
  "priority_check_blurbs": [          // \u05DC\u05DB\u05DC \u05E4\u05E8\u05D9\u05D8 \u05D1-priority_checks: \u05DE\u05E9\u05E4\u05D8 \u05E7\u05E6\u05E8 \u05E9\u05DE\u05E1\u05D1\u05D9\u05E8 \u05DC\u05DE\u05D4 \u05D6\u05D4 \u05D7\u05E9\u05D5\u05D1
    {"id": "pc-1", "copy_blurb": "..."},
    ...
  ],
  "improvement_blurbs": [             // \u05DC\u05DB\u05DC \u05E4\u05E8\u05D9\u05D8 \u05D1-improvement_opportunities
    {"id": "io-1", "copy_blurb": "..."},
    ...
  ]
}

\u05D3\u05D5\u05D2\u05DE\u05D0\u05D5\u05EA \u05DC\u05D8\u05D5\u05DF:

\u05E2\u05D5\u05D3\u05E3:
"headline_copy": "\u05D4\u05DE\u05E9\u05DB\u05D5\u05E8\u05EA \u05DE\u05DB\u05E1\u05D4 \u05D0\u05EA \u05D4\u05E7\u05D1\u05D5\u05E2 \u05D5\u05E0\u05E9\u05D0\u05E8 \u05DE\u05E8\u05D7\u05D1 \u05DC\u05D7\u05D9\u05D9\u05DD. \u05D4\u05E9\u05D0\u05DC\u05D4 \u05DE\u05D4 \u05E2\u05D5\u05E9\u05D9\u05DD \u05D0\u05D9\u05EA\u05D5."

\u05D7\u05D5\u05E1\u05E8:
"headline_copy": "\u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9\u05D5\u05EA \u05D7\u05D5\u05E8\u05D2\u05D5\u05EA \u05DE\u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D4\u05E7\u05D1\u05D5\u05E2\u05D4. \u05D4\u05E4\u05E2\u05E8 \u05E7\u05D8\u05DF \u05D9\u05D7\u05E1\u05D9\u05EA \u2014 \u05D5\u05E0\u05D9\u05EA\u05DF \u05DC\u05D8\u05D9\u05E4\u05D5\u05DC."

\u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05E9\u05EA\u05E0\u05D4:
"headline_copy": "\u05D4\u05EA\u05DE\u05D5\u05E0\u05D4 \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9\u05EA \u05E9\u05DC\u05DB\u05DD \u05EA\u05DC\u05D5\u05D9\u05D4 \u05D1\u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05E9\u05EA\u05E0\u05D4. \u05D1\u05D7\u05D5\u05D3\u05E9\u05D9\u05DD \u05D1\u05DC\u05D9 \u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D4\u05D6\u05D5 \u05D9\u05E9 \u05D7\u05D5\u05E1\u05E8; \u05D1\u05D7\u05D5\u05D3\u05E9\u05D9\u05DD \u05E9\u05D1\u05D4\u05DD \u05D4\u05D9\u05D0 \u05E0\u05DB\u05E0\u05E1\u05EA \u2014 \u05DE\u05EA\u05E7\u05D1\u05DC \u05E2\u05D5\u05D3\u05E3."

priority_check \u05DC\u05D3\u05D5\u05D2\u05DE\u05D4 (\u05DE\u05E0\u05D5\u05D9\u05D9\u05DD):
"copy_blurb": "\u05DE\u05E0\u05D5\u05D9\u05D9\u05DD \u05DC\u05D1\u05D3\u05D9\u05E7\u05D4: \u20AA187/\u05D7\u05D5\u05D3\u05E9 \u2014 \u05E4\u05D5\u05D8\u05E0\u05E6\u05D9\u05D0\u05DC \u05D4\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05EA\u05DC\u05D5\u05D9 \u05D1\u05DE\u05D4 \u05E9\u05D1\u05D0\u05DE\u05EA \u05D1\u05E9\u05D9\u05DE\u05D5\u05E9."

priority_check \u05DC\u05D3\u05D5\u05D2\u05DE\u05D4 (BIT/PayBox):
"copy_blurb": "\u05E0\u05E7\u05D5\u05D3\u05D4 \u05E2\u05D9\u05D5\u05D5\u05E8\u05EA \u2014 \u05DC\u05D0 \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05D0\u05D1\u05DC \u05D2\u05DD \u05DC\u05D0 \u05D7\u05DC\u05E7 \u05DE\u05D4\u05EA\u05DE\u05D5\u05E0\u05D4. \u05E9\u05D5\u05D5\u05D4 \u05DC\u05E4\u05E8\u05E7."

\u05D0\u05DD \u05D0\u05EA\u05D4 \u05DC\u05D0 \u05D1\u05D8\u05D5\u05D7 \u05DE\u05D4 \u05DC\u05DB\u05EA\u05D5\u05D1 \u2014 \u05E7\u05E6\u05E8 \u05E2\u05D3\u05D9\u05E3 \u05E2\u05DC \u05D0\u05E8\u05D5\u05DA. \u05E2\u05D3\u05D9\u05E3 \u05DE\u05E9\u05E4\u05D8 \u05D0\u05D7\u05D3 \u05E0\u05DB\u05D5\u05DF \u05DE\u05D0\u05E9\u05E8 \u05E9\u05E0\u05D9 \u05DE\u05E9\u05E4\u05D8\u05D9\u05DD \u05E9\u05D0\u05D7\u05D3 \u05DE\u05D4\u05DD \u05DE\u05D5\u05DE\u05E6\u05D0.`;
function buildUserMessage(reportModel) {
  return `\u05D4\u05E0\u05D4 \u05D4-ReportModel \u05D4\u05DE\u05DC\u05D0 \u05D5\u05D4\u05DE\u05D7\u05D5\u05E9\u05D1:

\`\`\`json
${JSON.stringify(reportModel, null, 2)}
\`\`\`

\u05DB\u05EA\u05D5\u05D1 \u05D0\u05EA \u05DB\u05DC \u05E9\u05D3\u05D5\u05EA \u05D4\u05E7\u05D5\u05E4\u05D9 \u05D4\u05E0\u05D3\u05E8\u05E9\u05D9\u05DD \u05E2\u05DC \u05E4\u05D9 \u05D4\u05E1\u05DB\u05DE\u05D4. \u05D4\u05D7\u05D6\u05E8 \u05E8\u05E7 JSON.`;
}

// supabase/functions/super-service/copy_writer.ts
function getPlaybookFor(model) {
  const id = model.selected_playbooks?.primary;
  if (!id) return null;
  return PLAYBOOKS[id] ?? null;
}
function flattenCopy(copy) {
  return [
    copy.headline_copy,
    copy.meaning_copy,
    ...copy.work_done_bullets,
    ...copy.priority_check_blurbs.map((b) => b.copy_blurb),
    ...copy.improvement_blurbs.map((b) => b.copy_blurb)
  ].join(" ").toLowerCase();
}
function validateAgainstPlaybook(copy, pb) {
  if (!pb) return [];
  const violations = [];
  const text = flattenCopy(copy);
  for (const phrase of pb.forbiddenClaims) {
    if (!phrase) continue;
    if (text.includes(phrase.toLowerCase())) {
      violations.push(`playbook[${pb.id}] forbids: "${phrase}"`);
    }
  }
  for (const phrase of pb.claudeCopyHints.doNotSay) {
    if (!phrase) continue;
    if (text.includes(phrase.toLowerCase())) {
      violations.push(`playbook[${pb.id}] doNotSay: "${phrase}"`);
    }
  }
  return violations;
}
function buildPlaybookGuidance(pb) {
  const doSay = pb.claudeCopyHints.doSay.map((s) => `  \u2022 ${s}`).join("\n");
  const doNot = pb.claudeCopyHints.doNotSay.map((s) => `  \u2022 ${s}`).join("\n");
  const forbid = pb.forbiddenClaims.map((s) => `  \u2022 ${s}`).join("\n");
  return `## \u05D4\u05E7\u05E9\u05E8 \u05EA\u05E8\u05D7\u05D9\u05E9 (playbook: ${pb.id})
\u05EA\u05D5\u05D5\u05D9\u05EA: ${pb.label}
\u05D8\u05D5\u05DF \u05E8\u05E6\u05D5\u05D9: ${pb.claudeCopyHints.tone}

\u05D4\u05E6\u05E2\u05D5\u05EA \u05DC\u05E0\u05D9\u05E1\u05D5\u05D7 \u05DB\u05D5\u05EA\u05E8\u05EA \u05D5\u05DE\u05E9\u05DE\u05E2\u05D5\u05EA (\u05D0\u05E4\u05E9\u05E8 \u05DC\u05D0\u05DE\u05E5 \u05D0\u05D5 \u05DC\u05D4\u05EA\u05D0\u05D9\u05DD, \u05D0\u05E1\u05D5\u05E8 \u05DC\u05E1\u05EA\u05D5\u05E8):
  \u2022 \u05DB\u05D5\u05EA\u05E8\u05EA: "${pb.ui.bottomLineHeadline}"
  \u2022 \u05DE\u05E9\u05DE\u05E2\u05D5\u05EA: "${pb.ui.meaningBody}"

\u05DE\u05D5\u05EA\u05E8/\u05DB\u05D3\u05D0\u05D9 \u05DC\u05D5\u05DE\u05E8:
${doSay}

\u05D0\u05E1\u05D5\u05E8 \u05DC\u05D5\u05DE\u05E8 (\u05DE\u05E9\u05E4\u05D8\u05D9\u05DD \u05D0\u05DC\u05D4 \u05D9\u05D1\u05D9\u05D0\u05D5 \u05DC\u05D3\u05D7\u05D9\u05D9\u05EA \u05D4\u05E4\u05DC\u05D8):
${doNot}
${forbid}`;
}
var ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
var REQUEST_TIMEOUT_MS = 12e3;
function formatILS3(n) {
  return "\u20AA" + Math.round(Math.abs(n)).toLocaleString("he-IL");
}
function fallbackHeadline(model) {
  const pb = getPlaybookFor(model);
  if (pb?.ui?.bottomLineHeadline) return pb.ui.bottomLineHeadline;
  const { summary_status, summary } = model;
  if (summary_status === "insufficient_data") {
    return "\u05D1\u05E7\u05D1\u05E6\u05D9\u05DD \u05E9\u05D4\u05E2\u05DC\u05D0\u05EA\u05DD \u05D0\u05D9\u05DF \u05DE\u05E1\u05E4\u05D9\u05E7 \u05E0\u05EA\u05D5\u05E0\u05D9\u05DD \u05DB\u05D3\u05D9 \u05DC\u05D7\u05E9\u05D1 \u05E9\u05D5\u05E8\u05D4 \u05EA\u05D7\u05EA\u05D5\u05E0\u05D4 \u05DE\u05DC\u05D0\u05D4.";
  }
  if (summary_status === "variable_dependent") {
    return "\u05D4\u05EA\u05DE\u05D5\u05E0\u05D4 \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9\u05EA \u05EA\u05DC\u05D5\u05D9\u05D4 \u05D1\u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05E9\u05EA\u05E0\u05D4 \u2014 \u05D1\u05D7\u05D5\u05D3\u05E9\u05D9\u05DD \u05D1\u05DC\u05D9 \u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05E0\u05D5\u05E6\u05E8 \u05D7\u05D5\u05E1\u05E8, \u05D1\u05D7\u05D5\u05D3\u05E9\u05D9\u05DD \u05E9\u05D1\u05D4\u05DD \u05D4\u05D9\u05D0 \u05E0\u05DB\u05E0\u05E1\u05EA \u05DE\u05EA\u05E7\u05D1\u05DC \u05E2\u05D5\u05D3\u05E3.";
  }
  if (summary_status === "surplus") {
    return `\u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D4\u05E7\u05D1\u05D5\u05E2\u05D4 \u05E9\u05DC\u05DB\u05DD \u05DE\u05DB\u05E1\u05D4 \u05D0\u05EA \u05DB\u05DC \u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9\u05D5\u05EA, \u05D5\u05E2\u05D5\u05D3 \u05E0\u05E9\u05D0\u05E8 ${formatILS3(summary.monthly_gap)}.`;
  }
  if (summary_status === "deficit") {
    return `\u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9\u05D5\u05EA \u05D7\u05D5\u05E8\u05D2\u05D5\u05EA \u05DE\u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D4\u05E7\u05D1\u05D5\u05E2\u05D4 \u05D1-${formatILS3(summary.monthly_gap)}.`;
  }
  return "\u05D4\u05D4\u05DB\u05E0\u05E1\u05D5\u05EA \u05D5\u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D4\u05D7\u05D5\u05D3\u05E9\u05D9\u05D5\u05EA \u05E9\u05DC\u05DB\u05DD \u05E7\u05E8\u05D5\u05D1\u05D5\u05EA \u05D6\u05D5 \u05DC\u05D6\u05D5.";
}
function fallbackMeaning(model) {
  const pb = getPlaybookFor(model);
  if (pb?.ui?.meaningBody) return pb.ui.meaningBody;
  if (model.summary_status === "insufficient_data") {
    return "\u05DB\u05D3\u05D9 \u05DC\u05E7\u05D1\u05DC \u05EA\u05DE\u05D5\u05E0\u05D4 \u05DE\u05DC\u05D0\u05D4, \u05E6\u05E8\u05D9\u05DA \u05DC\u05D4\u05E2\u05DC\u05D5\u05EA \u05DC\u05E4\u05D7\u05D5\u05EA \u05E2\u05D5\u05F4\u05E9 \u05D5\u05DB\u05E8\u05D8\u05D9\u05E1\u05D9 \u05D0\u05E9\u05E8\u05D0\u05D9 \u05DC\u05D7\u05D5\u05D3\u05E9 \u05D0\u05D7\u05D3 \u05E9\u05DC\u05DD.";
  }
  if (model.summary_status === "variable_dependent") {
    return "\u05D4\u05D4\u05DB\u05E0\u05E1\u05D4 \u05D4\u05E7\u05D1\u05D5\u05E2\u05D4 \u05DE\u05DB\u05E1\u05D4 \u05D0\u05EA \u05D4\u05D4\u05D5\u05E6\u05D0\u05D5\u05EA \u05D4\u05E7\u05D1\u05D5\u05E2\u05D5\u05EA, \u05D0\u05D1\u05DC \u05DC\u05D0 \u05DE\u05E9\u05D0\u05D9\u05E8\u05D4 \u05DE\u05E8\u05D7\u05D1. \u05D4\u05D4\u05DB\u05E0\u05E1\u05D5\u05EA \u05D4\u05DE\u05E9\u05EA\u05E0\u05D5\u05EA \u05D9\u05DB\u05D5\u05DC\u05D5\u05EA \u05DC\u05E1\u05D2\u05D5\u05E8 \u05D0\u05EA \u05D4\u05E4\u05E2\u05E8 \u05DB\u05E9\u05D4\u05DF \u05DE\u05D2\u05D9\u05E2\u05D5\u05EA.";
  }
  if (model.summary_status === "surplus") {
    return "\u05D9\u05E9 \u05DC\u05DB\u05DD \u05E2\u05D5\u05D3\u05E3 \u05E9\u05D0\u05E4\u05E9\u05E8 \u05DC\u05D4\u05E4\u05E0\u05D5\u05EA \u05DC\u05D7\u05D9\u05E1\u05DB\u05D5\u05DF, \u05DC\u05D4\u05DC\u05D5\u05D5\u05D0\u05D4, \u05D0\u05D5 \u05DC\u05D4\u05D5\u05E6\u05D0\u05D4 \u05D2\u05DE\u05D9\u05E9\u05D4. \u05D4\u05D3\u05D5\u05D7 \u05DE\u05E8\u05D0\u05D4 \u05D0\u05D9\u05E4\u05D4 \u05D4\u05D5\u05D0 \u05DE\u05E1\u05EA\u05EA\u05E8.";
  }
  if (model.summary_status === "deficit") {
    return "\u05D4\u05D7\u05D5\u05E1\u05E8 \u05E0\u05D9\u05EA\u05DF \u05DC\u05D8\u05D9\u05E4\u05D5\u05DC. \u05D4\u05D3\u05D5\u05D7 \u05DE\u05E1\u05DE\u05DF \u05D0\u05D9\u05E4\u05D4 \u05D9\u05E9 \u05DC\u05DB\u05DD \u05D4\u05DB\u05D9 \u05D4\u05E8\u05D1\u05D4 \u05E9\u05DC\u05D9\u05D8\u05D4 \u05D5\u05D0\u05D9\u05E4\u05D4 \u05DB\u05D3\u05D0\u05D9 \u05DC\u05D4\u05EA\u05D7\u05D9\u05DC.";
  }
  return "\u05D4\u05EA\u05E7\u05E6\u05D9\u05D1 \u05E9\u05DC\u05DB\u05DD \u05DE\u05D0\u05D5\u05D6\u05DF \u05D1\u05E8\u05D2\u05E2 \u05D6\u05D4. \u05D4\u05D3\u05D5\u05D7 \u05DE\u05E8\u05D0\u05D4 \u05D0\u05D9\u05E4\u05D4 \u05D9\u05E9 \u05D2\u05DE\u05D9\u05E9\u05D5\u05EA \u05DC\u05E2\u05EA\u05D9\u05D3.";
}
function fallbackWorkDoneBullets(model) {
  const out = [];
  out.push(`\u05E7\u05E8\u05D0\u05E0\u05D5 ${model.work_done.transactions_reviewed.toLocaleString("he-IL")} \u05EA\u05E0\u05D5\u05E2\u05D5\u05EA \u05DE\u05D4\u05E7\u05D1\u05E6\u05D9\u05DD \u05E9\u05D4\u05E2\u05DC\u05D0\u05EA\u05DD`);
  if (model.income_model.variable.length > 0) {
    out.push("\u05D4\u05E4\u05E8\u05D3\u05E0\u05D5 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05E7\u05D1\u05D5\u05E2\u05D4 \u05DE\u05D4\u05DB\u05E0\u05E1\u05D4 \u05DE\u05E9\u05EA\u05E0\u05D4");
  }
  if (model.work_done.cc_charges_deduplicated > 0) {
    out.push(`\u05DE\u05E0\u05E2\u05E0\u05D5 \u05E1\u05E4\u05D9\u05E8\u05D4 \u05DB\u05E4\u05D5\u05DC\u05D4 \u05E9\u05DC ${model.work_done.cc_charges_deduplicated} \u05D7\u05D9\u05D5\u05D1\u05D9 \u05D0\u05E9\u05E8\u05D0\u05D9 \u05E9\u05DE\u05D5\u05E4\u05D9\u05E2\u05D9\u05DD \u05D2\u05DD \u05D1\u05E2\u05D5\u05F4\u05E9`);
  }
  if (model.work_done.one_time_items_excluded > 0) {
    out.push(`\u05E1\u05D9\u05DE\u05E0\u05D5 ${model.work_done.one_time_items_excluded} \u05E4\u05E8\u05D9\u05D8\u05D9\u05DD \u05D7\u05D3\u05BE\u05E4\u05E2\u05DE\u05D9\u05D9\u05DD \u2014 \u05DC\u05D0 \u05E0\u05E1\u05E4\u05E8\u05D9\u05DD \u05DB\u05D4\u05D5\u05E6\u05D0\u05D4 \u05D7\u05D5\u05D3\u05E9\u05D9\u05EA`);
  }
  return out;
}
function fallbackPriorityBlurb(check) {
  return check.why_it_matters;
}
function fallbackImprovementBlurb(io) {
  if (io.evidence_strength === "review_only") {
    return `\u05E1\u05E2\u05D9\u05E3 \u05E9\u05D3\u05D5\u05E8\u05E9 \u05E1\u05E7\u05D9\u05E8\u05D4 \u2014 ${io.amount_label}. \u05DC\u05D0 \u05D7\u05D9\u05E1\u05DB\u05D5\u05DF \u05D5\u05D3\u05D0\u05D9, \u05D0\u05D1\u05DC \u05E9\u05D5\u05D5\u05D4 \u05D1\u05D3\u05D9\u05E7\u05D4.`;
  }
  return `${io.amount_label}. \u05E1\u05E2\u05D9\u05E3 \u05E9\u05D9\u05E9 \u05DC\u05DB\u05DD \u05E2\u05DC\u05D9\u05D5 \u05E9\u05DC\u05D9\u05D8\u05D4 \u05D9\u05E9\u05D9\u05E8\u05D4 \u2014 \u05DB\u05DC \u05D4\u05E4\u05D7\u05EA\u05D4 \u05DB\u05D0\u05DF \u05DE\u05EA\u05D5\u05E8\u05D2\u05DE\u05EA \u05DE\u05D9\u05D9\u05D3\u05D9\u05EA \u05DC\u05D7\u05D5\u05E1\u05DA.`;
}
function buildFallbackCopy(model) {
  return {
    headline_copy: fallbackHeadline(model),
    meaning_copy: fallbackMeaning(model),
    work_done_bullets: fallbackWorkDoneBullets(model),
    priority_check_blurbs: model.priority_checks.map((c) => ({
      id: c.id,
      copy_blurb: fallbackPriorityBlurb(c)
    })),
    improvement_blurbs: model.improvement_opportunities.map((io) => ({
      id: io.id,
      copy_blurb: fallbackImprovementBlurb(io)
    }))
  };
}
async function callClaude(model, apiKey) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const pb = getPlaybookFor(model);
    const guidance = pb ? buildPlaybookGuidance(pb) + "\n\n" : "";
    const userMessage = guidance + buildUserMessage(model);
    const res = await fetch(ANTHROPIC_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }]
      })
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.content?.[0]?.text;
    if (!text) return null;
    const cleaned = text.replace(/^[\s\S]*?```(?:json)?/, "").replace(/```[\s\S]*$/, "").trim();
    const parsed = JSON.parse(cleaned);
    const copy = {
      headline_copy: String(parsed.headline_copy ?? ""),
      meaning_copy: String(parsed.meaning_copy ?? ""),
      work_done_bullets: Array.isArray(parsed.work_done_bullets) ? parsed.work_done_bullets.map(String) : [],
      priority_check_blurbs: Array.isArray(parsed.priority_check_blurbs) ? parsed.priority_check_blurbs.map((b) => ({ id: String(b.id ?? ""), copy_blurb: String(b.copy_blurb ?? "") })) : [],
      improvement_blurbs: Array.isArray(parsed.improvement_blurbs) ? parsed.improvement_blurbs.map((b) => ({ id: String(b.id ?? ""), copy_blurb: String(b.copy_blurb ?? "") })) : []
    };
    return copy;
  } catch (_e) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
async function writeCopy(model) {
  const apiKey = typeof Deno !== "undefined" && Deno.env?.get?.("ANTHROPIC_API_KEY") || "";
  const fallback = buildFallbackCopy(model);
  if (!apiKey) return fallback;
  const fromClaude = await callClaude(model, apiKey);
  if (!fromClaude) return fallback;
  const violations = validateClaudeCopy(fromClaude);
  if (violations.length > 0) {
    return fallback;
  }
  const pb = getPlaybookFor(model);
  const playbookViolations = validateAgainstPlaybook(fromClaude, pb);
  if (playbookViolations.length > 0) {
    return fallback;
  }
  return fromClaude;
}

// supabase/functions/super-service/pipeline.ts
async function runPipeline(req) {
  const facts = extractFacts(req.rows, req.context);
  const classification = classify(facts);
  if (!req.answers || req.answers.length === 0) {
    const gate = clarificationGate(facts, classification);
    if (gate.blocking_questions.length > 0) {
      return { kind: "needs_clarification", questions: gate.blocking_questions };
    }
  }
  const { classification: cls2, overrides } = applyAnswers(
    facts,
    classification,
    req.answers ?? []
  );
  const model = buildReportModel(facts, cls2, req.answers ?? [], overrides);
  const copy = await writeCopy(model);
  model.summary.headline_copy = copy.headline_copy;
  model.summary.meaning_copy = copy.meaning_copy;
  model.work_done.bullets_copy = copy.work_done_bullets;
  for (const blurb of copy.priority_check_blurbs) {
    const target = model.priority_checks.find((p) => p.id === blurb.id);
    if (target) target.copy_blurb = blurb.copy_blurb;
  }
  for (const blurb of copy.improvement_blurbs) {
    const target = model.improvement_opportunities.find((p) => p.id === blurb.id);
    if (target) target.copy_blurb = blurb.copy_blurb;
  }
  return { kind: "report", report_model: model };
}
export {
  runPipeline
};
