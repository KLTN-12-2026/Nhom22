import test from 'node:test';
import assert from 'node:assert/strict';
import { newMotivation, motivationPayload, motivationErrors } from '../src/lib/engagement-admin.mjs';

test('badge writes retain server version and immutable code without copying response-only fields', () => {
  const original = { id: '9223372036854775800', ma: 'CHUOI_7', version: 12 };
  const body = motivationPayload('badges', {
    ...newMotivation('badges'), ma: 'CHANGED', ten: '  Một tuần  ', moTa: '  Đạt chuỗi bảy ngày  ',
    loaiDieuKien: 'CHUOI_NGAY', nguong: '7', thuTu: '3', version: 99, id: 'other', daNhan: true,
  }, original);
  assert.deepEqual(body, { ma: 'CHUOI_7', ten: 'Một tuần', moTa: 'Đạt chuỗi bảy ngày', hoatDong: true, version: 12, loaiDieuKien: 'CHUOI_NGAY', nguong: 7, thuTu: 3 });
});

test('new challenge uses weekly valid-review contract, no fabricated id or version', () => {
  const body = motivationPayload('challenges', { ...newMotivation('challenges'), ma: ' TUAN_40 ', ten: ' Tuần học ', moTa: ' Ôn 40 lượt ', mucTieu: '40' });
  assert.deepEqual(body, { ma: 'TUAN_40', ten: 'Tuần học', moTa: 'Ôn 40 lượt', hoatDong: true, loaiDieuKien: 'LUOT_ON', chuKy: 'TUAN', mucTieu: 40 });
});

test('toggle preserves server condition and target, without sending learner progress', () => {
  const item = { id: '9', ma: 'TUAN_40', ten: 'Tuần nhẹ nhàng', moTa: 'Ôn trong tuần', loaiDieuKien: 'LUOT_ON', chuKy: 'TUAN', mucTieu: 40, hoatDong: true, version: 4, giaTri: 15 };
  const body = motivationPayload('challenges', { ...item, hoatDong: false }, item);
  assert.equal(body.hoatDong, false);
  assert.equal(body.mucTieu, 40);
  assert.equal(body.version, 4);
  assert.equal('giaTri' in body, false);
  assert.equal('id' in body, false);
});

test('validation rejects blank text, invalid code, unsupported condition and non-integer limits', () => {
  const errors = motivationErrors('badges', { ...newMotivation('badges'), ma: '7_lower', ten: '  ', moTa: '  ', loaiDieuKien: 'CUSTOM', nguong: '1.5', thuTu: '-1' });
  assert.deepEqual(Object.keys(errors).sort(), ['loaiDieuKien', 'ma', 'moTa', 'nguong', 'ten', 'thuTu']);
  for (const value of ['', '0', '-1', '1.5', '1e3', '2147483648']) {
    assert.ok(motivationErrors('challenges', { ...newMotivation('challenges'), ma: 'TUAN', ten: 'Tuần', moTa: 'Mô tả', mucTieu: value }).mucTieu);
  }
});

test('valid badge and challenge drafts satisfy current server limits', () => {
  assert.deepEqual(motivationErrors('badges', { ...newMotivation('badges'), ma: 'BUOC_DAU', ten: 'Bước đầu', moTa: 'Lượt ôn đầu tiên' }), {});
  assert.deepEqual(motivationErrors('challenges', { ...newMotivation('challenges'), ma: 'TUAN', ten: 'Tuần học', moTa: 'Đạt lượt ôn trong tuần' }), {});
});
