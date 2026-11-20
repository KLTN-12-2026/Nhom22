import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  attentionFlags, daysLeft, daysSince, formatMoney, heatLevel, initials, learningMax, userAuditUrl, userDetailUrl,
} from '../src/lib/admin-user-detail.mjs';

const NOW = new Date(2026, 10, 21, 10, 0, 0).getTime();

test('urls target the detail endpoint and the audit log filtered by user', () => {
  assert.equal(userDetailUrl('42'), '/api/v1/admin/users/42');
  assert.equal(userAuditUrl('42', 1), '/api/v1/admin/audit-logs?loai=NGUOI_DUNG&doiTuongId=42&page=1&size=10');
});

test('initials and money formatting', () => {
  assert.equal(initials('Nguyễn Văn An'), 'VA');
  assert.equal(initials('  '), '?');
  assert.equal(formatMoney(299000), '299.000 ₫');
  assert.equal(formatMoney(null), '0 ₫');
});

test('day helpers count whole days', () => {
  assert.equal(daysLeft(new Date(NOW + 3 * 86_400_000 - 1000).toISOString(), NOW), 3);
  assert.equal(daysLeft(null, NOW), null);
  assert.equal(daysSince('2026-11-21', NOW), 0);
  assert.equal(daysSince('2026-11-01', NOW), 20);
  assert.equal(daysSince(null, NOW), null);
});

test('heat levels scale from 0 to 4', () => {
  const days = [{ luotOn: 0 }, { luotOn: 5 }, { luotOn: 20 }];
  const max = learningMax(days);
  assert.equal(max, 20);
  assert.deepEqual(days.map(day => heatLevel(day.luotOn, max)), [0, 1, 4]);
  assert.equal(heatLevel(3, 0), 0);
});

test('attention flags surface what an admin should look at', () => {
  const flags = attentionFlags({
    nguoiDung: { trangThai: 'HOAT_DONG' },
    baoCao: { biBaoCaoChoXuLy: 2 },
    goiHienTai: { goiMa: 'PRO', tenGoi: 'Pro', hetHanAt: new Date(NOW + 2 * 86_400_000).toISOString(), huyAt: null },
    thanhToan: { soThatBai: 1 },
    hocTap: { hocCuoiNgay: '2026-11-01' },
  }, NOW).map(flag => flag.text);
  assert.deepEqual(flags, [
    '2 báo cáo về nội dung của người này đang chờ xử lý',
    'Gói Pro hết hạn sau 2 ngày',
    '1 giao dịch thất bại',
    'Không học 20 ngày',
  ]);
  assert.deepEqual(attentionFlags({ nguoiDung: { trangThai: 'BI_KHOA' }, hocTap: {} }, NOW).map(flag => flag.text), ['Tài khoản đang bị khóa']);
  assert.deepEqual(attentionFlags(null), []);
});
