export const CSV_COLUMNS = [
  'transaction_id',
  'date',
  'description',
  'account',
  'account_type',
  'side',
  'amount',
  'currency',
  'rate_to_brl',
] as const;

export type CsvRow = {
  /** 1-based line number in the file, for error messages. */
  line: number;
  transaction_id: string;
  date: string;
  description: string;
  account: string;
  account_type: string;
  side: string;
  amount: string;
  currency: string;
  rate_to_brl: string;
};

export type CsvParse = { ok: true; rows: CsvRow[] } | { ok: false; errors: string[] };

/** Splits CSV text into records of fields with the line each record starts on. Handles quotes, "" and newlines in quotes. */
function splitRecords(text: string): { line: number; fields: string[] }[] | string {
  const records: { line: number; fields: string[] }[] = [];
  let fields: string[] = [];
  let field = '';
  let quoted = false;
  let wasQuoted = false;
  let line = 1;
  let startLine = 1;

  const endField = () => {
    fields.push(wasQuoted ? field : field.trim());
    field = '';
    wasQuoted = false;
  };
  const endRecord = () => {
    endField();
    if (!(fields.length === 1 && fields[0] === '')) records.push({ line: startLine, fields });
    fields = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        if (ch === '\n') line++;
        field += ch;
      }
    } else if (ch === '"' && field.trim() === '') {
      quoted = true;
      wasQuoted = true;
      field = '';
    } else if (ch === ',') {
      endField();
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      endRecord();
      line++;
      startLine = line;
    } else {
      field += ch;
    }
  }
  if (quoted) return `Line ${startLine}: a quoted field is never closed.`;
  if (field !== '' || fields.length > 0) endRecord();
  return records;
}

/** Parses the import CSV: checks the header, the column count of every line, and returns rows with line numbers. */
export function parseCsv(input: string): CsvParse {
  const text = input.replace(/^﻿/, '');
  const records = splitRecords(text);
  if (typeof records === 'string') return { ok: false, errors: [records] };
  if (records.length === 0) return { ok: false, errors: ['The file is empty.'] };

  const header = records[0];
  const expected = CSV_COLUMNS.join(',');
  if (header.fields.join(',') !== expected) {
    return { ok: false, errors: [`Line ${header.line}: the header must be exactly "${expected}".`] };
  }

  const errors: string[] = [];
  const rows: CsvRow[] = [];
  for (const { line, fields } of records.slice(1)) {
    if (fields.length !== CSV_COLUMNS.length) {
      errors.push(`Line ${line}: expected ${CSV_COLUMNS.length} columns, found ${fields.length}.`);
      continue;
    }
    const row = { line } as CsvRow;
    CSV_COLUMNS.forEach((name, i) => {
      row[name] = fields[i];
    });
    rows.push(row);
  }
  if (errors.length > 0) return { ok: false, errors };
  if (rows.length === 0) return { ok: false, errors: ['The file has a header but no rows.'] };
  return { ok: true, rows };
}
