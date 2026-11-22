import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  contentLink, errorRate, quotaChanges, quotaInputError, quotaPlans, rangeDates, reasonError, reportsUrl,
  resolveReport, snapshotRows, updateQuotas, usageUrl,
} from '../src/lib/admin-ops.mjs';

function recorder() {
  const calls = [];
  const fetcher = (url, options = {}) => { calls.push({ url, ...options }); return Promise.resolve({}); };
  return { calls, fetcher };
}

test('reportsUrl sends only the filters that are set', () => {
  assert.equal(reportsUrl({ trangThai: 'CHO_XU_LY', page: 2 }), '/api/v1/admin/reports?page=2&size=20&trangThai=CHO_XU_LY');
  assert.equal(reportsUrl({ loaiDoiTuong: 'BO_THE' }), '/api/v1/admin/reports?page=0&size=20&loaiDoiTuong=BO_THE');
});

test('resolveReport posts the decision with a trimmed reason', async () => {
  const { calls, fetcher } = recorder();
  await resolveReport(fetcher, '7', { quyetDinh: 'AN', lyDo: '  Nội dung sai nghĩa rõ ràng  ' });
  assert.equal(calls[0].url, '/api/v1/admin/reports/7/resolve');
  assert.equal(calls[0].method, 'POST');
  assert.deepEqual(JSON.parse(calls[0].body), { quyetDinh: 'AN', lyDo: 'Nội dung sai nghĩa rõ ràng' });
});

test('reasonError enforces 10 to 500 characters after trimming', () => {
  assert.match(reasonError('   ngắn   '), /còn thiếu 6/);
  assert.equal(reasonError('Đủ mười ký tự rồi'), '');
  assert.match(reasonError('x'.repeat(501)), /tối đa 500/);
});

test('snapshotRows shows the card fields that exist, in reading order', () => {
  const rows = snapshotRows({ loaiDoiTuong: 'THE_TU_VUNG', noiDung: { tu: 'stakeholder', nghiaVi: 'bên liên quan', phienAm: '', boMau: true } });
  assert.deepEqual(rows, [['Từ', 'stakeholder'], ['Nghĩa', 'bên liên quan']]);
});

test('contentLink opens sample decks in admin and library cards with the card highlighted', () => {
  assert.equal(contentLink({ loaiDoiTuong: 'BO_THE', doiTuongId: '30', noiDung: { boMau: true } }), '/quan-tri/bo-mau?id=30');
  assert.equal(contentLink({ loaiDoiTuong: 'BO_THE', doiTuongId: '31', noiDung: { boMau: false } }), '/thu-vien/31');
  assert.equal(contentLink({ loaiDoiTuong: 'THE_TU_VUNG', doiTuongId: '9', noiDung: { boTheId: '30' } }), '/thu-vien/30?the=9');
  assert.equal(contentLink({ loaiDoiTuong: 'YEU_CAU_AI', doiTuongId: '1', noiDung: {} }), null);
});

test('usage range covers the chosen number of days ending today', () => {
  assert.deepEqual(rangeDates(7, '2026-11-21'), { tuNgay: '2026-11-15', denNgay: '2026-11-21' });
  assert.deepEqual(rangeDates(30, '2026-03-01'), { tuNgay: '2026-01-31', denNgay: '2026-03-01' });
  assert.equal(usageUrl({}), '/api/v1/admin/service-usage');
  assert.equal(usageUrl({ tuNgay: '2026-11-15', denNgay: '2026-11-21' }), '/api/v1/admin/service-usage?tuNgay=2026-11-15&denNgay=2026-11-21');
});

test('quotaChanges keeps only edited cells with their version', async () => {
  const items = [
    { goiMa: 'PRO', loai: 'AI', soLuotNgay: 20, version: 2 },
    { goiMa: 'PREMIUM', loai: 'AI', soLuotNgay: 100, version: 0 },
  ];
  const changes = quotaChanges(items, { 'PRO:AI': '25', 'PREMIUM:AI': '100' });
  assert.deepEqual(changes, [{ goiMa: 'PRO', loai: 'AI', soLuotNgay: 25, version: 2, truoc: 20 }]);
  const { calls, fetcher } = recorder();
  await updateQuotas(fetcher, changes, ' Tăng hạn mức cho đợt thi ');
  assert.equal(calls[0].method, 'PUT');
  assert.deepEqual(JSON.parse(calls[0].body), { hanMuc: [{ goiMa: 'PRO', loai: 'AI', soLuotNgay: 25, version: 2 }], lyDo: 'Tăng hạn mức cho đợt thi' });
});

test('quota inputs accept whole numbers from 0 to 10000 and plans keep PRO before PREMIUM', () => {
  assert.equal(quotaInputError('0'), '');
  assert.equal(quotaInputError(''), 'Nhập số lượt');
  assert.equal(quotaInputError('2.5'), 'Phải là số nguyên');
  assert.match(quotaInputError('10001'), /Từ 0 đến/);
  assert.deepEqual(quotaPlans([{ goiMa: 'PREMIUM' }, { goiMa: 'PRO' }, { goiMa: 'PRO' }]), ['PRO', 'PREMIUM']);
});

test('errorRate counts failed and unknown requests; services without error tracking return null', () => {
  assert.equal(errorRate({ soLuotDung: 18, soLoi: 1, soKhongXacDinh: 1 }), 10);
  assert.equal(errorRate({ soLuotDung: 0, soLoi: 0, soKhongXacDinh: 0 }), 0);
  assert.equal(errorRate({ soLuotDung: 5, soLoi: null, soKhongXacDinh: null }), null);
});
