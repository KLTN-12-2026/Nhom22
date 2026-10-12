import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csvHeaders, CSV_TEMPLATE } from '../src/lib/csv.mjs';

test('CSV headers support BOM, quoted commas, escaped quotes and CRLF', () => {
  assert.deepEqual(csvHeaders('\uFEFF"word,name","meaning""vi"\r\na,b'), ['word,name', 'meaning"vi']);
  assert.deepEqual(csvHeaders(CSV_TEMPLATE).slice(0, 3), ['tu', 'tuLoai', 'nghiaVi']);
});
test('CSV rejects ambiguous headers and unterminated quotes', () => {
  for (const input of ['tu,tu\n', 'tu,\n', '"unterminated', '"tu"garbage,nghiaVi\n']) assert.throws(() => csvHeaders(input));
});
