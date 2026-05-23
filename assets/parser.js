// Phase 1 stub. Real implementation uses SheetJS to parse Excel locally
// in the browser (Phase 3). For Phase 1, this returns a synthetic
// normalized payload after a brief delay so the upload screen flows.
//
// Real signature will be:
//   parseFiles(File[]) -> Promise<{rows: NormalizedRow[], files_present: {bank, credit_card}}>
//
// Row trimming will keep >= 300 rows per sheet with priority on rows
// containing salary keywords. Salary detection in classify will run on
// raw_description, never on cleaned_name.

export async function parseFiles(files) {
  // Detect file types from filename heuristics. The real parser will
  // inspect headers/sheet structure as well.
  const filesPresent = { bank: false, credit_card: false };
  for (const f of files) {
    const t = detectFileType(f.name);
    if (t === "bank") filesPresent.bank = true;
    if (t === "credit_card") filesPresent.credit_card = true;
  }

  // Phase 1: fake a parse delay then return an empty rows payload.
  // The processing screen drives its own animation; this resolve only
  // gates the transition.
  await new Promise(r => setTimeout(r, 400));

  return {
    rows: [],
    files_present: filesPresent,
    months_covered: 3
  };
}

export function detectFileType(filename) {
  const lower = (filename || "").toLowerCase();
  if (/(max|מקס|isracard|ישראכרט|cal|כאל|visa|ויזה|cc|credit|אשראי)/.test(lower)) {
    return "credit_card";
  }
  if (/(bank|פועלים|לאומי|דיסקונט|מזרחי|hapoalim|leumi|עו.?ש|os|cheking|checking)/.test(lower)) {
    return "bank";
  }
  return "unknown";
}
