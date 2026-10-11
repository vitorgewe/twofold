import { parseCsv } from './csv';

const HEADER = 'transaction_id,date,description,account,account_type,side,amount,currency,rate_to_brl';

describe('parseCsv', () => {
  it('reads rows with their line numbers', () => {
    const result = parseCsv(`${HEADER}\nt-1,2026-09-05,Supermarket,Checking,asset,credit,300.00,BRL,\n\nt-1,2026-09-05,Supermarket,Groceries,expense,debit,300.00,BRL,\n`);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows.map((r) => [r.line, r.account, r.rate_to_brl])).toEqual([
      [2, 'Checking', ''],
      [4, 'Groceries', ''],
    ]);
  });

  it('keeps a comma, an escaped quote and a newline inside quotes', () => {
    const result = parseCsv(`${HEADER}\nt-1,2026-09-05,"Dinner, ""late""\nwith friends",Checking,asset,credit,1.00,BRL,\n`);
    expect(result.ok && result.rows[0].description).toBe('Dinner, "late"\nwith friends');
  });

  it('accepts CRLF line endings and a byte order mark', () => {
    const result = parseCsv(`﻿${HEADER}\r\nt-1,2026-09-05,A,Checking,asset,credit,1.00,BRL,\r\n`);
    expect(result.ok && result.rows).toHaveLength(1);
  });

  it('numbers lines after a multi-line quoted field', () => {
    const result = parseCsv(`${HEADER}\nt-1,2026-09-05,"a\nb",Checking,asset,credit,1.00,BRL,\nt-1,2026-09-05,"a\nb",X,asset,debit,1.00,BRL,`);
    expect(result.ok && result.rows.map((r) => r.line)).toEqual([2, 4]);
  });

  it('rejects a wrong header', () => {
    expect(parseCsv('id,date\n1,2')).toEqual({
      ok: false,
      errors: [expect.stringContaining('Line 1: the header must be exactly')],
    });
  });

  it('reports every line with the wrong number of columns', () => {
    const result = parseCsv(`${HEADER}\nt-1,2026-09-05,A,Checking\nt-2,2026-09-05,B,Checking,asset,credit,1.00,BRL,,extra\n`);
    expect(result).toEqual({
      ok: false,
      errors: ['Line 2: expected 9 columns, found 4.', 'Line 3: expected 9 columns, found 10.'],
    });
  });

  it('ignores blanks after a closing quote and rejects other characters there', () => {
    const ok = parseCsv(`${HEADER}\nt-1,2026-09-05,"Cash" ,Checking,asset,credit,1.00,BRL,\n`);
    expect(ok).toMatchObject({ ok: true, rows: [{ description: 'Cash' }] });
    expect(parseCsv(`${HEADER}\nt-1,2026-09-05,"a"b,Checking,asset,credit,1.00,BRL,\n`)).toEqual({
      ok: false,
      errors: ['Line 2: unexpected character after a closing quote.'],
    });
  });

  it('rejects an unclosed quote, an empty file and a file without rows', () => {
    expect(parseCsv(`${HEADER}\nt-1,2026-09-05,"oops,Checking`).ok).toBe(false);
    expect(parseCsv('')).toEqual({ ok: false, errors: ['The file is empty.'] });
    expect(parseCsv(`${HEADER}\n`)).toEqual({ ok: false, errors: ['The file has a header but no rows.'] });
  });
});
