// Dictionaries used by the deterministic classifier (Stage B).
//
// Phase 2: data only. The matching logic lives in classify/index.ts
// and is built in Phase 3. Adding a merchant/keyword here should NEVER
// require code changes elsewhere — keep this file pure data.
//
// Matching rules:
//   - All scans run against `raw_description`, not `cleaned_name`.
//   - Hebrew + Latin variants both included where common.
//   - Case-insensitive substring match unless noted.

// ====================================================================
// SALARY — fixed income detection
// ====================================================================

/** Generic salary keywords. Presence of any one of these in raw_description
 *  is a strong signal for income. Combined with employer match below it
 *  becomes fixed_income; alone it may be variable_income. */
export const SALARY_KEYWORDS = [
  "משכורת",
  "שכר",
  "salary",
  "payroll",
  "ישר משכורת",
  "תשלום שכר"
];

/** Known Israeli employers. Substring match against raw_description. */
export const KNOWN_EMPLOYERS = [
  // Tech
  "אמדוקס", "Amdocs",
  "Intel", "אינטל",
  "Microsoft", "מיקרוסופט",
  "Google", "גוגל",
  "Meta", "מטא", "פייסבוק", "Facebook",
  "Apple", "אפל",
  "Wix", "וויקס",
  "Monday", "מאנדיי", "מנדיי",
  "Elbit", "אלביט",
  "Check Point", "צ׳ק פוינט", "צ'ק פוינט", "checkpoint",
  "Matrix", "מטריקס",
  "NICE", "נייס",
  "Mellanox", "מלאנוקס",
  "IBM",
  "Oracle", "אורקל",
  "SAP",
  // Finance / banks / insurance
  "בנק הפועלים", "Bank Hapoalim",
  "בנק לאומי", "Bank Leumi",
  "מגדל", // appears here as employer too — disambiguated by amount/pattern
  "הראל",
  "כלל",
  "מנורה",
  // Healthcare / public
  "שירותי בריאות כללית",
  "מכבי שירותי בריאות",
  "משרד החינוך",
  "משרד הבריאות",
  "צה״ל", "צבא הגנה לישראל"
];

// ====================================================================
// CC DEDUP — bank-internal credit card charges (NEVER expenses)
// ====================================================================

/** Phrases in bank descriptions that mean "the bank just paid the CC".
 *  These rows must be excluded from monthly expense totals — the actual
 *  expenses live in the credit card files as line items.
 *
 *  Counting both = double-counting ALL credit card spending. This is the
 *  single most damaging bug that has plagued past versions. */
export const CC_INTERNAL_CHARGE_PHRASES = [
  "מקס חיוב",
  "מקס איט פי",
  "MAX",
  "ישראכרט חיוב",
  "ישראכרט",
  "כאל חיוב",
  "כאל",
  "ויזה חיוב",
  "ויזה כ.א.ל",
  "ויזה",
  "Visa",
  "Isracard",
  "Cal",
  "כרטיסי אשראי",
  "American Express חיוב"
];

// ====================================================================
// UTILITIES — household_bill, never blocking
// ====================================================================

export const UTILITY_KEYWORDS = [
  "חברת חשמל", "חשמל",
  "מים", "מי תקווה", "מי הרצל", "חברת מים", "תאגיד מים",
  "גז", "סופרגז", "פזגז", "אמישראגז",
  "בזק", "Bezeq",
  "הוט", "Hot",
  "yes", "YES",
  "פרטנר", "Partner",
  "סלקום", "Cellcom",
  "פלאפון", "Pelephone",
  "012", "013", "014", "015", "016", "017", "018", "019",
  "ארנונה",
  "ועד בית",
  "טריפלפליי"
];

// ====================================================================
// MEDICAL — non_blocking when one-time and under threshold
// ====================================================================

export const MEDICAL_KEYWORDS = [
  "מכבידנט", "Maccabident", "MaccabiDent",
  "מכבי",
  "כללית",
  "מאוחדת",
  "לאומית",
  "דנט", "Dent",
  "פארם", "Pharm",
  "בית מרקחת",
  "רופא", "מרפאה",
  "אופטיק", "אופטומטריסט",
  "פסיכולוג"
];

// ====================================================================
// KIDS / EDUCATION
// ====================================================================

export const KIDS_EDU_KEYWORDS = [
  "PlaySmart", "פליי סמארט",
  "חוג", "חוגים",
  "צהרון", "צהריים",
  "גן", "גני ילדים",
  "בית ספר",
  "שמרטף", "מטפלת",
  "ילדים",
  "לימוד"
];

// ====================================================================
// BEAUTY / PERSONAL CARE
// ====================================================================

export const BEAUTY_KEYWORDS = [
  "סקין", "Skin",
  "beauty", "ביוטי",
  "care", "קייר",
  "קוסמטיקה", "Cosmetic",
  "ספא", "Spa",
  "מספרה", "מעצב שיער",
  "ציפורניים", "מניקור"
];

// ====================================================================
// SAVINGS / ONE-TIME INCOME (never /חודש)
// ====================================================================

export const ONE_TIME_INCOME_KEYWORDS = [
  "מגדל",                  // also appears as employer — disambiguate by amount/pattern
  "קרן השתלמות",
  "גמל", "קופת גמל",
  "פנסיה",
  "פיצויים",
  "פדיון",
  "הון השתלמות",
  "תמורת קרן"
];

// ====================================================================
// FOOD / RESTAURANTS — flexible_spending (no moral judgment)
// ====================================================================

export const FOOD_KEYWORDS = [
  // Delivery / restaurants
  "וולט", "Wolt",
  "10Bis", "תן ביס",
  "Mishloha", "משלוחה",
  "Cibus", "סיבוס",
  "מסעדה", "Restaurant",
  "Cafe", "קפה",
  "Starbucks", "סטארבקס",
  "ארומה", "Aroma",
  // Supermarkets
  "שופרסל", "Shufersal",
  "רמי לוי", "Rami Levy",
  "ויקטורי", "Victory",
  "מגה", "Mega",
  "טיב טעם", "Tiv Taam",
  "אושר עד",
  "יוחננוף",
  "סופר"
];

// ====================================================================
// SUBSCRIPTIONS — review_only by default
// ====================================================================

export const SUBSCRIPTION_KEYWORDS = [
  "Netflix", "נטפליקס",
  "Spotify", "ספוטיפיי",
  "Apple", "iCloud", "Apple Music",
  "YouTube", "יוטיוב",
  "Disney", "דיסני",
  "HBO",
  "Amazon Prime",
  "Adobe",
  "Microsoft 365",
  "Google One",
  "Notion",
  "NYT", "New York Times",
  "Times of Israel",
  "Calcalist",
  "Haaretz", "הארץ"
];

// ====================================================================
// BIT / PAYBOX — review_only blind spots
// ====================================================================

export const BIT_PAYBOX_KEYWORDS = [
  "BIT", "ביט",
  "PayBox", "פייבוקס",
  "PayPal", "פייפאל"
];

// ====================================================================
// DEBT / LOANS — fixed_commitment
// ====================================================================

export const DEBT_KEYWORDS = [
  "הלוואה",
  "החזר",
  "ריבית",
  "תשלום הלוואה",
  "Loan",
  "משכנתא", "Mortgage"
];
