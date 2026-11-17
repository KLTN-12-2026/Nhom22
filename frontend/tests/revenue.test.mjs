import { test } from 'node:test';
import assert from 'node:assert/strict';
import { revenueRows, revenueCsv, revenuePlans, revenueUrl, yearRangeError, vietnamDate } from '../src/lib/revenue.mjs';

const data = {
  ky: 'THANG', nam: 2026, tongDoanhThu: 1500000, soGiaoDich: 3, soVoiKyTruocPhanTram: -25,
  cacKy: [
    { nhan: 'Tháng 10', tuNgay: '2026-10-01', denNgay: '2026-10-31', doanhThu: 1000000, soGiaoDich: 2, theoGoi: { PRO: 600000, PREMIUM: 400000 } },
    { nhan: 'Tháng 11', tuNgay: '2026-11-01', denNgay: '2026-11-30', doanhThu: 500000, soGiaoDich: 1, theoGoi: { PRO: 0, PREMIUM: 500000 } },
    { nhan: 'Tháng 12', tuNgay: '2026-12-01', denNgay: '2026-12-31', doanhThu: 0, soGiaoDich: 0, theoGoi: { PRO: 0, PREMIUM: 0 } },
  ],
};

test('uses Vietnam date at midnight and preserves financial amounts and period boundaries', () => {
  const today = vietnamDate(new Date('2026-10-31T17:00:00Z'));
  assert.equal(today, '2026-11-01');
  const rows = revenueRows(data, today);
  assert.equal(rows[0].partial, false);
  assert.equal(rows[1].partial, true);
  assert.equal(rows[2].future, true);
  assert.equal(rows[1].growth, -50);
  assert.equal(rows[0].growth, null);
  assert.equal(rows.reduce((sum, row) => sum + row.doanhThu, 0), data.tongDoanhThu);
  assert.deepEqual(revenuePlans(rows).map(plan => plan.amount), [600000, 900000]);
  const zeroPrevious = structuredClone(data);
  zeroPrevious.cacKy[0].doanhThu = 0;
  assert.equal(revenueRows(zeroPrevious, today)[1].growth, null);
});

test('requests the right API parameters and rejects reversed or overlong annual ranges', () => {
  const filters = { period: 'THANG', year: 2026, fromYear: 2022, toYear: 2026 };
  assert.equal(revenueUrl(filters), '/api/v1/admin/revenue?ky=THANG&nam=2026');
  assert.equal(revenueUrl({ ...filters, period: 'QUY' }), '/api/v1/admin/revenue?ky=QUY&nam=2026');
  assert.equal(revenueUrl({ ...filters, period: 'NAM' }), '/api/v1/admin/revenue?ky=NAM&tuNam=2022&denNam=2026');
  assert.equal(yearRangeError({ ...filters, period: 'NAM', fromYear: 2007 }), '');
  assert.ok(yearRangeError({ ...filters, period: 'NAM', fromYear: 2006 }));
  assert.ok(yearRangeError({ ...filters, period: 'NAM', fromYear: 2027 }));
});

test('CSV exports server totals, negative numeric growth, future notes and safe text', () => {
  const modified = structuredClone(data);
  modified.cacKy[0].nhan = '=SUM(1,2)';
  const csv = revenueCsv(modified, revenueRows(modified, '2026-11-17'));
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"\'=SUM(1,2)/2026"'));
  assert.ok(csv.includes('"-50"'));
  assert.ok(csv.includes('"Chưa đến kỳ"'));
  assert.ok(csv.includes('"Tổng cộng","","","600000","900000","1500000","3","-25"'));
  assert.equal(csv.split('\r\n').length, 5);
});
