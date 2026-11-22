import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fieldValue, summarize, wordDiff } from '../src/lib/copy-diff.mjs';

test('word diff marks only the changed words and joins adjacent changes', () => {
  const { before, after } = wordDiff('Học giao tiếp cơ bản', 'Học giao tiếp nâng cao mỗi ngày');
  assert.deepEqual(before, [{ text: 'Học giao tiếp ', type: 'same' }, { text: 'cơ bản', type: 'del' }]);
  assert.deepEqual(after, [{ text: 'Học giao tiếp ', type: 'same' }, { text: 'nâng cao mỗi ngày', type: 'add' }]);
});

test('word diff keeps identical text unmarked', () => {
  const { before, after } = wordDiff('quả táo', 'quả táo');
  assert.deepEqual(before, [{ text: 'quả táo', type: 'same' }]);
  assert.deepEqual(after, [{ text: 'quả táo', type: 'same' }]);
});

test('summary and labels describe copy changes in Vietnamese', () => {
  assert.deepEqual(summarize({ boThe: [{}], soThem: 2, soSua: 1, soXoa: 0 }), ['1 thông tin bộ', '2 thẻ mới', '1 thẻ sửa']);
  assert.deepEqual(summarize({ boThe: [], soThem: 0, soSua: 0, soXoa: 0 }), []);
  assert.equal(fieldValue('trinhDo', 'NANG_CAO'), 'Nâng cao');
  assert.equal(fieldValue('doKho', 3), '3/5');
  assert.equal(fieldValue('moTa', ''), null);
});
