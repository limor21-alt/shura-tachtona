// Excel parser — runs in the browser, files never leave the device.
//
// SheetJS is loaded as a global via assets/vendor/xlsx.mini.min.js
// (script tag in index.html). Hosting it locally avoids CDN dependency
// for a financial app. Output matches the NormalizedRow contract in
// supabase/functions/super-service/schema.ts.
//
// Heuristics:
//   - File type (bank | credit_card) detected from sheet name + header
//     row + filename, in that order (content beats filename).
//   - Header row located by scanning the first ~40 rows for known
//     Hebrew column labels.
//   - Dates accepted as Excel serial OR string formats DD/MM/YYYY,
//     DD.MM.YYYY, DD-MM-YYYY, YYYY-MM-DD.
//   - Amount columns: a combined signed "זכות/חובה" column (Bank Leumi
//     style), split "זכות"/"חובה" columns, or a single signed amount
//     like "סכום חיוב" / "סכום העסקה" (credit-card exports).
//   - "לובי הלוואות" sheets are detected and skipped — they're loan
//     summaries, not transactions; the actual loan payments already show
//     up in the bank statement.
//   - Rows missing date or amount are skipped (probably metadata or
//     totals lines).

// SheetJS exposed as window.XLSX via <script> in index.html.
const XLSX = /** @type {any} */ (globalThis).XLSX;
if (!XLSX) {
  throw new Error("SheetJS not loaded — make sure assets/vendor/xlsx.mini.min.js is included before this module.");
}

// ---- file type detection ----------------------------------------

const CC_FILENAME_PATTERNS = [
  /max/i, /מקס/, /isracard/i, /ישראכרט/, /cal/i, /כא[״"]?ל/, /visa/i, /ויזה/,
  /amex/i, /american.*express/i, /credit/i, /אשראי/,
  // Discount Bank credit-card portal exports.
  /transaction[_-]?details/i, /transactiondetails/i
];
const BANK_FILENAME_PATTERNS = [
  /bank/i, /hapoalim/i, /פועלים/, /leumi/i, /לאומי/, /discount/i, /דיסקונט/,
  /mizrahi/i, /מזרחי/, /benleumi/i, /בינלאומי/, /מרכנתיל/, /יהב/, /יו[״"]?ש/, /עו[״"]?ש/
];

export function detectFileType(filename) {
  const f = filename || "";
  if (CC_FILENAME_PATTERNS.some(re => re.test(f))) return "credit_card";
  if (BANK_FILENAME_PATTERNS.some(re => re.test(f))) return "bank";
  return "unknown";
}

const HEADER_HINTS_BANK = [
  "תיאור פעולה", "תיאור התנועה", "תיאור", "פעולה",
  "סכום בזכות", "סכום בחובה", "זכות", "חובה",
  "תאריך ערך", "תאריך תנועה"
];
const HEADER_HINTS_CC = [
  "שם בית עסק", "שם בית-עסק", "שם בית העסק", "בית עסק", "בית העסק",
  "תיאור עסקה",
  "סכום העסקה", "סכום החיוב", "סכום עסקה", "סכום חיוב",
  "תאריך עסקה", "תאריך רכישה", "תאריך חיוב",
  "מפתח דיסקונט", "ספרות אחרונות של כרטיס"
];

function detectTypeFromHeaders(headerRow) {
  const joined = headerRow.map(h => String(h || "")).join("|").toLowerCase();
  const ccHits   = HEADER_HINTS_CC.filter(h => joined.includes(h.toLowerCase())).length;
  const bankHits = HEADER_HINTS_BANK.filter(h => joined.includes(h.toLowerCase())).length;
  if (ccHits > bankHits) return "credit_card";
  if (bankHits > 0) return "bank";
  return null;
}

// Sheet names are a strong signal in Israeli exports — "עובר ושב" / "עו״ש"
// for bank, "עסקאות …" (חיוב / חו״ל / מט״ח) for credit card.
function detectTypeFromSheetName(sheetName) {
  const sn = String(sheetName || "");
  if (sn.includes("עובר ושב") || /עו["״]ש/.test(sn)) return "bank";
  if (sn.includes("עסקאות")) return "credit_card";
  return null;
}

// "לובי הלוואות" / "הלוואות פעילות" — Leumi's loan-summary sheet. It
// lists active loans (principal, balance, monthly payment) rather than
// transactions, so it should be skipped cleanly instead of triggering a
// generic "format not recognised" warning. The actual loan payments
// already appear in the bank statement as "פירעון הלוואה …".
function isLoansLobbySheet(sheetName) {
  const sn = String(sheetName || "");
  return sn.includes("לובי הלוואות") || sn.includes("הלוואות פעילות");
}

// ---- header row discovery ---------------------------------------

const ALL_HEADER_KEYWORDS = [
  "תאריך", "תיאור", "סכום", "פעולה", "עסקה", "בית עסק",
  "זכות", "חובה", "יתרה"
];

function findHeaderRow(rows) {
  // Scan first 40 rows for any cell containing a header keyword. Some
  // exports have ~10 metadata rows before the header (filters, totals,
  // disclaimers), so 30 was a tight fit.
  const limit = Math.min(rows.length, 40);
  for (let i = 0; i < limit; i++) {
    const row = rows[i] || [];
    const cells = row.map(c => String(c || "").trim());
    const hits = ALL_HEADER_KEYWORDS.filter(kw =>
      cells.some(c => c.includes(kw))
    ).length;
    if (hits >= 2) return i;
  }
  return -1;
}

// ---- column resolution ------------------------------------------

function findCol(headerCells, candidates) {
  for (let i = 0; i < headerCells.length; i++) {
    const h = String(headerCells[i] || "").trim();
    for (const cand of candidates) {
      if (h.includes(cand)) return i;
    }
  }
  return -1;
}

// Bank Leumi (and a few others) export a single signed column whose header
// is "₪ זכות/חובה" — positive = credit, negative = debit. If we match
// "זכות" and "חובה" as separate columns, both resolve to this one column
// and the debit branch wrongly flips income to expenses. Detect the
// combined header up-front and treat it as a signed amount column.
function findCombinedSignedAmountCol(headerCells) {
  for (let i = 0; i < headerCells.length; i++) {
    const h = String(headerCells[i] || "");
    if (h.includes("זכות") && h.includes("חובה")) return i;
  }
  return -1;
}

function resolveColumns(headerCells, fileType) {
  // "תאריך ערך" (value date) intentionally comes after "תאריך תנועה"
  // and "תאריך עסקה" — we want the transaction date, not the value date.
  const dateCol = findCol(headerCells, [
    "תאריך תנועה", "תאריך עסקה", "תאריך רכישה", "תאריך ערך", "תאריך"
  ]);
  const descCol = findCol(headerCells, [
    "תיאור פעולה", "תיאור התנועה",
    // "שם בית העסק" (with ה) is what Discount's portal uses; "שם בית עסק"
    // (without ה) is what others use. Both, plus the shorter "בית …" forms.
    "שם בית העסק", "שם בית עסק", "בית העסק", "בית עסק",
    "תיאור עסקה", "תיאור"
  ]);

  const signedAmountCol = findCombinedSignedAmountCol(headerCells);
  let debitCol = -1;
  let creditCol = -1;
  if (signedAmountCol < 0) {
    debitCol  = findCol(headerCells, ["סכום בחובה", "חובה"]);
    creditCol = findCol(headerCells, ["סכום בזכות", "זכות"]);
  }
  const amountCol = findCol(headerCells, [
    // More specific first so "סכום חיוב" (Discount CC) wins over the bare
    // "סכום" fallback when both happen to appear.
    "סכום העסקה", "סכום החיוב", "סכום עסקה", "סכום חיוב", "סכום"
  ]);
  return { dateCol, descCol, debitCol, creditCol, signedAmountCol, amountCol, fileType };
}

// ---- value parsing ----------------------------------------------

function parseDate(value) {
  if (value == null || value === "") return null;
  // Excel serial number
  if (typeof value === "number") {
    // SheetJS provides a helper for this
    const d = XLSX.SSF?.parse_date_code?.(value);
    if (d && d.y && d.m && d.d) {
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
  }
  const s = String(value).trim();
  // YYYY-MM-DD
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`;
  // DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY
  m = s.match(/^(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})/);
  if (m) {
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    return `${year}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
  }
  return null;
}

function parseAmount(value) {
  if (value == null || value === "") return null;
  if (typeof value === "number") return value;
  const s = String(value).replace(/[₪,\s]/g, "").trim();
  if (!s) return null;
  // Parentheses are negative in some bank exports: (123.45)
  const isNeg = /^\(.+\)$/.test(s);
  const cleaned = s.replace(/[()]/g, "");
  const n = parseFloat(cleaned);
  if (!isFinite(n)) return null;
  return isNeg ? -n : n;
}

// ---- per-sheet parser -------------------------------------------

function parseSheet({ sheet, sheetName, fileId, filename, filenameType }) {
  const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null, blankrows: false });
  if (!rawRows || rawRows.length === 0) return [];

  const headerRow = findHeaderRow(rawRows);
  if (headerRow < 0) return [];

  const headerCells = rawRows[headerRow];
  // Content beats filename: sheet-name and header text are more reliable
  // than a guessable filename. Fall back to filename last.
  const detectedType =
    detectTypeFromHeaders(headerCells) ||
    detectTypeFromSheetName(sheetName) ||
    filenameType;
  const cols = resolveColumns(headerCells, detectedType);

  const out = [];
  for (let i = headerRow + 1; i < rawRows.length; i++) {
    const row = rawRows[i] || [];
    const date = cols.dateCol >= 0 ? parseDate(row[cols.dateCol]) : null;
    if (!date) continue;

    const rawDesc = cols.descCol >= 0 ? String(row[cols.descCol] || "").trim() : "";
    if (!rawDesc) continue;

    let amount = null;
    if (cols.signedAmountCol >= 0) {
      // Single signed column ("₪ זכות/חובה"): use the sign as-is.
      const a = parseAmount(row[cols.signedAmountCol]);
      if (a !== null && a !== 0) amount = a;
    } else if (cols.debitCol >= 0 || cols.creditCol >= 0) {
      const debit  = cols.debitCol  >= 0 ? parseAmount(row[cols.debitCol])  : null;
      const credit = cols.creditCol >= 0 ? parseAmount(row[cols.creditCol]) : null;
      if (debit && debit !== 0)        amount = -Math.abs(debit);
      else if (credit && credit !== 0) amount = Math.abs(credit);
    }
    if (amount === null && cols.amountCol >= 0) {
      const a = parseAmount(row[cols.amountCol]);
      if (a !== null) {
        // Credit-card exports list charges as positive numbers; flip to
        // negative so the downstream pipeline treats them as expenses.
        // Refunds (already negative in the source) become positive — the
        // sign-preserving form a < 0 ? -a : -a is just -Math.abs, but we
        // need: positive charge → negative; negative refund → positive.
        amount = detectedType === "credit_card" ? -a : a;
      }
    }
    if (amount === null || isNaN(amount) || amount === 0) continue;

    out.push({
      source: detectedType === "credit_card" ? "credit_card" : "bank",
      file_id: fileId,
      sheet: sheetName,
      row_index: i,
      date,
      raw_description: rawDesc,
      cleaned_name: rawDesc.replace(/\d+/g, "").replace(/\s+/g, " ").trim(),
      amount,
      currency: "ILS",
      account_mask: ""
    });
  }
  return out;
}

// ---- public API -------------------------------------------------

/** Parse an array of File objects into NormalizedRow[].
 *  Returns { rows, files_present, months_covered, warnings }. */
export async function parseFiles(files) {
  const allRows = [];
  const warnings = [];
  const filesPresent = { bank: false, credit_card: false };
  const monthsSet = new Set();

  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    const fileId = `f${idx + 1}`;
    const filenameType = detectFileType(file.name);

    let buf;
    try {
      buf = await file.arrayBuffer();
    } catch (e) {
      warnings.push(`לא הצלחנו לקרוא את ${file.name}`);
      continue;
    }

    let wb;
    try {
      wb = XLSX.read(buf, { type: "array", cellDates: false });
    } catch (e) {
      warnings.push(`${file.name}: לא קובץ Excel תקין`);
      continue;
    }

    let fileRowCount = 0;
    let loansLobbyOnly = wb.SheetNames.length > 0;
    for (const sheetName of wb.SheetNames) {
      if (isLoansLobbySheet(sheetName)) continue;
      loansLobbyOnly = false;
      const sheet = wb.Sheets[sheetName];
      const rows = parseSheet({ sheet, sheetName, fileId, filename: file.name, filenameType });
      for (const r of rows) {
        if (r.source === "bank") filesPresent.bank = true;
        if (r.source === "credit_card") filesPresent.credit_card = true;
        if (r.date && r.date.length >= 7) monthsSet.add(r.date.slice(0, 7));
      }
      fileRowCount += rows.length;
      allRows.push(...rows);
    }

    if (fileRowCount === 0 && wb.SheetNames.length > 0) {
      if (loansLobbyOnly) {
        warnings.push(`${file.name}: זה קובץ סיכום הלוואות, לא תנועות. תשלומי ההלוואה כבר מופיעים בעו״ש — אין צורך להעלות אותו.`);
      } else {
        warnings.push(`${file.name}: לא זוהו תנועות. ייתכן שהפורמט שונה.`);
      }
    }
  }

  return {
    rows: allRows,
    files_present: filesPresent,
    months_covered: monthsSet.size,
    warnings
  };
}
