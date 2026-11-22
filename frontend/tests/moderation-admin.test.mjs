import test from 'node:test';
import assert from 'node:assert/strict';
import { reportQuery, reportTitle, resolutionPayload, snapshotEntries } from '../src/lib/moderation-admin.mjs';

test('queue filters use server enums and zero-based pages, omitting all filters', () => {
  assert.equal(reportQuery({ trangThai: 'CHO_XU_LY', loaiDoiTuong: 'YEU_CAU_AI', page: 2 }), 'trangThai=CHO_XU_LY&loaiDoiTuong=YEU_CAU_AI&page=2&size=20');
  assert.equal(reportQuery(), 'page=0&size=20');
});

test('moderation sends only a valid explicit decision and a trimmed reason', () => {
  assert.deepEqual(resolutionPayload('AN', '  Nội dung sai cần được ẩn.  '), { quyetDinh: 'AN', lyDo: 'Nội dung sai cần được ẩn.' });
  assert.deepEqual(resolutionPayload('GIU', 'x'.repeat(500)), { quyetDinh: 'GIU', lyDo: 'x'.repeat(500) });
  for (const decision of ['', 'DELETE', 'DA_AN']) assert.throws(() => resolutionPayload(decision, 'Lý do đã kiểm tra.'), error => error.field === 'quyetDinh');
  for (const reason of ['', '          ', '  abc  ', 'x'.repeat(501)]) assert.throws(() => resolutionPayload('GIU', reason), error => error.field === 'lyDo');
});

test('evidence preserves false values, numbers and nested AI results, excluding internal IDs', () => {
  const aiResult = { ketQua: { loi: [], dungTuMucTieu: false }, banNhap: [{ tu: 'invoice', nghiaVi: 'hóa đơn' }] };
  const snapshot = { ten: 'Bộ mẫu', chuSoHuuId: '9223372036854775800', boTheId: '10', boMau: false, empty: null, count: 0, ...aiResult };
  assert.deepEqual(snapshotEntries(snapshot), [['boMau', false], ['count', 0], ['ketQua', aiResult.ketQua], ['banNhap', aiResult.banNhap]]);
  assert.deepEqual(snapshotEntries(null), []);
});

test('missing titles retain exact large server IDs without numeric conversion', () => {
  assert.equal(reportTitle({ loaiDoiTuong: 'THE_TU_VUNG', doiTuongId: '9223372036854775800' }), 'Thẻ từ vựng #9223372036854775800');
  assert.equal(reportTitle({ noiDung: { ten: '<script>text only</script>' } }), '<script>text only</script>');
});
