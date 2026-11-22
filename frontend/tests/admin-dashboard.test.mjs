import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actionLabel, compactMoney, delta, linePoints, planShare, queueItems, relativeTime, scaleMax, shortDay, sparkPath } from '../src/lib/admin-dashboard.mjs';

test('delta compares with the previous period and handles a zero base', () => {
  assert.deepEqual(delta(110, 100), { text: '+10%', tone: 'up' });
  assert.deepEqual(delta(90, 100), { text: '-10%', tone: 'down' });
  assert.deepEqual(delta(5, 0), { text: 'kỳ trước bằng 0', tone: 'flat', noBase: true });
  assert.equal(delta(0, 0), null);
  assert.deepEqual(delta(3, 3), { text: '0%', tone: 'flat' });
});

test('scaleMax rounds the axis up to a readable step', () => {
  assert.equal(scaleMax(0), 4);
  assert.equal(scaleMax(9), 10);
  assert.equal(scaleMax(412), 800);
  assert.equal(scaleMax(18_400_000), 20_000_000);
});

test('linePoints maps the first and last value to the chart edges', () => {
  const points = linePoints([0, 5, 10], { width: 100, height: 50, left: 10, top: 0, max: 10 });
  assert.deepEqual(points[0], [10, 50]);
  assert.deepEqual(points[2], [110, 0]);
});

test('sparkPath draws one segment per value', () => {
  assert.equal(sparkPath([]), '');
  assert.equal(sparkPath([1, 2, 3]).split(' ').length, 3);
});

test('money, labels and dates read naturally in Vietnamese', () => {
  assert.equal(compactMoney(18_400_000), '18,4 tr');
  assert.equal(compactMoney(79_000), '79.000 đ');
  assert.equal(actionLabel('KHOA_TAI_KHOAN'), 'khóa tài khoản');
  assert.equal(actionLabel('MOT_HANH_DONG_MOI'), 'mot hanh dong moi');
  assert.equal(shortDay('2026-11-05'), '05/11');
  const now = Date.parse('2026-11-21T10:00:00Z');
  assert.equal(relativeTime('2026-11-21T09:58:00Z', now), '2 phút trước');
  assert.equal(relativeTime('2026-11-21T07:00:00Z', now), '3 giờ trước');
});

test('planShare counts active users without a paid plan as free', () => {
  const share = planShare({ chiSo: { dangHoatDong: 100, thueBaoHieuLuc: 20 }, coCauGoi: [{ goiMa: 'PRO', ten: 'Pro', soNguoi: 15 }, { goiMa: 'PREMIUM', ten: 'Premium', soNguoi: 5 }] });
  assert.deepEqual(share.rows.map(r => r.count), [80, 15, 5]);
  assert.equal(share.paidPct, 20);
});

test('queueItems marks a publish request older than 48 hours as overdue', () => {
  const old = new Date(Date.now() - 72 * 3600e3).toISOString();
  const items = queueItems({ congKhaiChoDuyet: 2, congKhaiCuNhatAt: old, baoCaoChoXuLy: 0, thueBaoSapHetHan: 1, giaoDichTreo: 0, chuaXacThucQua48h: 3, tacVuLoi24h: 0 });
  assert.equal(items.find(i => i.key === 'publish').overdue, true);
  assert.equal(items.find(i => i.key === 'unverified').href, '/quan-tri/tai-khoan?trangThai=CHUA_XAC_THUC');
});
