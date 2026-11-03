import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardPayload, cardSchema, safeNext, normalizeTerm } from '../src/lib/content-contract.mjs';
import { uploadFile, validateFile } from '../src/lib/upload-file.mjs';

const values = { tu: 'receipt', tuLoai: 'n.', nghiaVi: 'biên lai', phienAm: '', viDuEn: '', dichVi: '', doKho: 2, nguon: '', nhanIds: [] };

test('card fields enforce actual backend limits including difficulty 5', () => {
  assert.ok(cardSchema.safeParse({ ...values, tu: 'a'.repeat(100), nghiaVi: 'a'.repeat(500), viDuEn: 'a'.repeat(300), doKho: 5 }).success);
  for (const [field, value] of [['tu', 'a'.repeat(101)], ['nghiaVi', 'a'.repeat(501)], ['viDuEn', 'a'.repeat(301)], ['doKho', 6], ['tu', '   ']]) assert.equal(cardSchema.safeParse({ ...values, [field]: value }).success, false);
});
test('new cards use native names and never inherit an edit version or removal flags', () => {
  const body = cardPayload({ ...values, anhId: '12', name: 'legacy', version: 4 });
  assert.equal(body.anhId, '12');
  assert.equal(body.version, undefined);
  assert.equal(body.name, undefined);
  assert.equal(body.boAnh, undefined);
});
test('edits keep shared references in their role and use explicit removal flags', () => {
  const body = cardPayload({ ...values, anhId: '12', amTuId: '', amCauId: '14' }, { anhId: '12', amTuId: '13', amCauId: '14', version: 7 });
  assert.equal(body.version, 7);
  assert.equal(body.anhId, '12');
  assert.equal(body.boAnh, undefined);
  assert.equal(body.boAmTu, true);
  assert.equal(body.amTuId, undefined);
  assert.equal(body.amCauId, '14');
});
test('login destinations stay local and bounded', () => {
  assert.equal(safeNext('/thu-vien/23?page=1'), '/thu-vien/23?page=1');
  for (const value of ['//evil.test', '/\\evil.test', 'https://evil.test', '/\nredirect', '/' + 'a'.repeat(201)]) assert.equal(safeNext(value), '/bo-the');
});
test('duplicate hints normalize spacing and case without removing meaningful accents', () => {
  assert.equal(normalizeTerm('  Apple   pie  '), 'apple pie');
  assert.notEqual(normalizeTerm('café'), normalizeTerm('cafe'));
});
test('upload type and size validation happens before requesting storage URLs', () => {
  for (const file of [{ type: 'image/gif', size: 5 }, { type: 'image/png', size: 2097153 }, { type: 'image/png', size: 0 }]) assert.throws(() => validateFile(file, 'ANH'));
  assert.doesNotThrow(() => validateFile({ type: 'audio/vnd.wave', size: 5242880 }, 'AM_THANH'));
});
test('uploads send byte checksum, matching MIME, no cookies to storage and complete after PUT', async () => {
  const calls = [];
  const file = new File(['actual-bytes'], 'image.png', { type: 'image/png' });
  const result = await uploadFile(file, 'ANH', async (path, options) => {
    calls.push({ path, options });
    if (path.endsWith('/upload-requests')) return { fileId: '99', uploadUrl: 'https://storage.example.test/upload' };
    return { id: '99' };
  }, async (path, options) => { calls.push({ path, options }); return new Response(null, { status: 200 }); });
  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.kichThuoc, 12);
  assert.match(body.checksum, /^[a-f0-9]{64}$/);
  assert.equal(calls[1].options.credentials, 'omit');
  assert.equal(calls[1].options.headers['Content-Type'], body.mimeType);
  assert.equal(calls[2].path, '/api/v1/files/99/complete');
  assert.equal(result.id, '99');
});
test('failed storage writes do not mark the file complete', async () => {
  const calls = [];
  await assert.rejects(uploadFile(new File(['x'], 'image.png', { type: 'image/png' }), 'ANH', async path => { calls.push(path); return { fileId: '9', uploadUrl: 'https://storage.example.test/upload' }; }, async () => new Response(null, { status: 500 })));
  assert.equal(calls.length, 1);
});
