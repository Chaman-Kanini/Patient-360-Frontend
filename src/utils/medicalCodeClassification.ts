// ─── ICD-10-CM Chapter Classification ───────────────────────────────────────
// Based on WHO ICD-10 / ICD-10-CM FY2026 chapter structure.
// Each chapter maps a code prefix range to a Roman numeral + title.

export interface ICD10Chapter {
  id: string;        // e.g. "I"
  range: string;     // e.g. "A00-B99"
  title: string;     // e.g. "Certain infectious and parasitic diseases"
  startLetter: string;
  startNum: number;
  endLetter: string;
  endNum: number;
}

export const ICD10_CHAPTERS: ICD10Chapter[] = [
  { id: 'I',    range: 'A00-B99',  title: 'Certain infectious and parasitic diseases',                          startLetter: 'A', startNum: 0,  endLetter: 'B', endNum: 99 },
  { id: 'II',   range: 'C00-D49',  title: 'Neoplasms',                                                         startLetter: 'C', startNum: 0,  endLetter: 'D', endNum: 49 },
  { id: 'III',  range: 'D50-D89',  title: 'Diseases of the blood and blood-forming organs',                     startLetter: 'D', startNum: 50, endLetter: 'D', endNum: 89 },
  { id: 'IV',   range: 'E00-E89',  title: 'Endocrine, nutritional and metabolic diseases',                      startLetter: 'E', startNum: 0,  endLetter: 'E', endNum: 89 },
  { id: 'V',    range: 'F01-F99',  title: 'Mental, behavioral and neurodevelopmental disorders',                 startLetter: 'F', startNum: 1,  endLetter: 'F', endNum: 99 },
  { id: 'VI',   range: 'G00-G99',  title: 'Diseases of the nervous system',                                     startLetter: 'G', startNum: 0,  endLetter: 'G', endNum: 99 },
  { id: 'VII',  range: 'H00-H59',  title: 'Diseases of the eye and adnexa',                                     startLetter: 'H', startNum: 0,  endLetter: 'H', endNum: 59 },
  { id: 'VIII', range: 'H60-H95',  title: 'Diseases of the ear and mastoid process',                            startLetter: 'H', startNum: 60, endLetter: 'H', endNum: 95 },
  { id: 'IX',   range: 'I00-I99',  title: 'Diseases of the circulatory system',                                 startLetter: 'I', startNum: 0,  endLetter: 'I', endNum: 99 },
  { id: 'X',    range: 'J00-J99',  title: 'Diseases of the respiratory system',                                 startLetter: 'J', startNum: 0,  endLetter: 'J', endNum: 99 },
  { id: 'XI',   range: 'K00-K95',  title: 'Diseases of the digestive system',                                   startLetter: 'K', startNum: 0,  endLetter: 'K', endNum: 95 },
  { id: 'XII',  range: 'L00-L99',  title: 'Diseases of the skin and subcutaneous tissue',                       startLetter: 'L', startNum: 0,  endLetter: 'L', endNum: 99 },
  { id: 'XIII', range: 'M00-M99',  title: 'Diseases of the musculoskeletal system and connective tissue',       startLetter: 'M', startNum: 0,  endLetter: 'M', endNum: 99 },
  { id: 'XIV',  range: 'N00-N99',  title: 'Diseases of the genitourinary system',                               startLetter: 'N', startNum: 0,  endLetter: 'N', endNum: 99 },
  { id: 'XV',   range: 'O00-O9A',  title: 'Pregnancy, childbirth and the puerperium',                           startLetter: 'O', startNum: 0,  endLetter: 'O', endNum: 99 },
  { id: 'XVI',  range: 'P00-P96',  title: 'Certain conditions originating in the perinatal period',             startLetter: 'P', startNum: 0,  endLetter: 'P', endNum: 96 },
  { id: 'XVII', range: 'Q00-Q99',  title: 'Congenital malformations, deformations and chromosomal abnormalities', startLetter: 'Q', startNum: 0,  endLetter: 'Q', endNum: 99 },
  { id: 'XVIII',range: 'R00-R99',  title: 'Symptoms, signs and abnormal clinical and laboratory findings',      startLetter: 'R', startNum: 0,  endLetter: 'R', endNum: 99 },
  { id: 'XIX',  range: 'S00-T88',  title: 'Injury, poisoning and certain other consequences of external causes', startLetter: 'S', startNum: 0,  endLetter: 'T', endNum: 88 },
  { id: 'XX',   range: 'V00-Y99',  title: 'External causes of morbidity',                                      startLetter: 'V', startNum: 0,  endLetter: 'Y', endNum: 99 },
  { id: 'XXI',  range: 'Z00-Z99',  title: 'Factors influencing health status and contact with health services', startLetter: 'Z', startNum: 0,  endLetter: 'Z', endNum: 99 },
  { id: 'XXII', range: 'U00-U85',  title: 'Codes for special purposes',                                        startLetter: 'U', startNum: 0,  endLetter: 'U', endNum: 85 },
];

export function getICD10Chapter(code: string): ICD10Chapter | null {
  if (!code || code.length < 3) return null;
  const letter = code.charAt(0).toUpperCase();
  const numPart = parseInt(code.substring(1, 3), 10);
  if (isNaN(numPart)) return null;

  for (const ch of ICD10_CHAPTERS) {
    const letterInRange =
      (letter >= ch.startLetter && letter <= ch.endLetter);
    if (!letterInRange) continue;

    if (ch.startLetter === ch.endLetter) {
      if (numPart >= ch.startNum && numPart <= ch.endNum) return ch;
    } else {
      if (letter === ch.startLetter && numPart >= ch.startNum) return ch;
      if (letter === ch.endLetter && numPart <= ch.endNum) return ch;
      if (letter > ch.startLetter && letter < ch.endLetter) return ch;
    }
  }
  return null;
}

// ─── CPT Category / Section Classification ──────────────────────────────────
// CPT codes are 5-digit numeric codes organized into Category I, II, and III.
// Category I is further divided into six major sections by numeric range.

export interface CPTSection {
  id: string;
  category: string;    // "Category I", "Category II", "Category III"
  range: string;       // e.g. "99201-99499"
  title: string;       // e.g. "Evaluation and Management"
  startCode: number;
  endCode: number;
}

export const CPT_SECTIONS: CPTSection[] = [
  // Category I sections
  { id: 'I-EM',    category: 'Category I',   range: '99201-99499', title: 'Evaluation and Management',            startCode: 99201, endCode: 99499 },
  { id: 'I-ANES',  category: 'Category I',   range: '00100-01999', title: 'Anesthesia',                           startCode: 100,   endCode: 1999  },
  { id: 'I-SURG',  category: 'Category I',   range: '10004-69990', title: 'Surgery',                              startCode: 10004, endCode: 69990 },
  { id: 'I-RAD',   category: 'Category I',   range: '70010-79999', title: 'Radiology',                            startCode: 70010, endCode: 79999 },
  { id: 'I-PATH',  category: 'Category I',   range: '80047-89398', title: 'Pathology and Laboratory',             startCode: 80047, endCode: 89398 },
  { id: 'I-MED',   category: 'Category I',   range: '90281-99199', title: 'Medicine (except E/M)',                 startCode: 90281, endCode: 99199 },
  // Category II — performance measurement
  { id: 'II',      category: 'Category II',  range: '0001F-9007F', title: 'Performance Measurement',              startCode: 1,     endCode: 9007  },
  // Category III — emerging technology
  { id: 'III',     category: 'Category III', range: '0042T-0999T', title: 'Emerging Technology / Services',        startCode: 42,    endCode: 999   },
];

export function getCPTSection(code: string): CPTSection | null {
  if (!code) return null;
  const cleaned = code.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

  // Category II codes end with 'F'
  if (cleaned.endsWith('F')) {
    return CPT_SECTIONS.find(s => s.id === 'II') || null;
  }
  // Category III codes end with 'T'
  if (cleaned.endsWith('T')) {
    return CPT_SECTIONS.find(s => s.id === 'III') || null;
  }

  // Category I — numeric
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return null;

  for (const sec of CPT_SECTIONS) {
    if (sec.category !== 'Category I') continue;
    if (num >= sec.startCode && num <= sec.endCode) return sec;
  }
  return null;
}
