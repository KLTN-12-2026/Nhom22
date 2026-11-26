import { test } from 'node:test';
import assert from 'node:assert/strict';
import { access, nextPlanFor, lowestPlanFor, upgradeFromError, usageLevel, formatLimit, planValue } from '../src/lib/plan-access.mjs';

const plans = [
  { ma: 'FREE', ten: 'Free', giaThang: 0, gioiHanThe: 300, phatAm: true, hanMucAi: 3, hanMucAnh: 0, hanMucPhatAm: 3, hanMucTts: 20 },
  { ma: 'PRO', ten: 'Pro', giaThang: 79000, gioiHanThe: 5000, phatAm: true, hanMucAi: 20, hanMucAnh: 3, hanMucPhatAm: 30, hanMucTts: 150 },
  { ma: 'PREMIUM', ten: 'Premium', giaThang: 129000, gioiHanThe: null, phatAm: true, hanMucAi: 60, hanMucAnh: 10, hanMucPhatAm: 100, hanMucTts: 500 }
];

test('free plan locks image AI and points at the cheapest plan that has it', () => {
  const image = access({ plans, planCode: 'FREE', feature: 'ANH' });
  assert.equal(image.locked, true);
  assert.equal(image.required.ma, 'PRO');
  assert.equal(access({ plans, planCode: 'PRO', feature: 'ANH' }).locked, false);
});

test('quota from the server wins and an empty quota is exhausted with a bigger plan offered', () => {
  const quota = { hanMuc: [{ loai: 'AI', gioiHan: 3, soDung: 3, soGiu: 0, conLai: 0 }] };
  const ai = access({ plans, planCode: 'FREE', quota, feature: 'AI' });
  assert.equal(ai.allowed, true);
  assert.equal(ai.exhausted, true);
  assert.equal(ai.remaining, 0);
  assert.equal(ai.upgrade.ma, 'PRO');
  assert.equal(access({ plans, planCode: 'PREMIUM', quota: { hanMuc: [{ loai: 'AI', gioiHan: 60, conLai: 0 }] }, feature: 'AI' }).upgrade, null);
});

test('admin never sees a lock', () => {
  const image = access({ plans, planCode: 'PREMIUM', admin: true, feature: 'ANH' });
  assert.equal(image.locked, false);
  assert.equal(image.upgrade, null);
});

test('server errors become upgrade prompts', () => {
  const limit = upgradeFromError(429, { message: 'hết lượt', details: { quyenLoi: 'HAN_MUC', loai: 'PHAT_AM', gioiHan: 3 } }, plans, 'FREE');
  assert.equal(limit.reason, 'HET_LUOT');
  assert.equal(limit.target.ma, 'PRO');
  const cards = upgradeFromError(422, { message: 'đủ thẻ', details: { quyenLoi: 'GIOI_HAN_THE', goiCanNangCap: 'PREMIUM' } }, plans, 'PRO');
  assert.equal(cards.feature, 'GIOI_HAN_THE');
  assert.equal(cards.target.ma, 'PREMIUM');
  assert.equal(upgradeFromError(422, { message: 'x' }, plans, 'FREE'), null);
  assert.equal(upgradeFromError(429, { details: { quyenLoi: 'HAN_MUC', loai: 'AI', gioiHan: 60 } }, plans, 'PREMIUM').target, null);
});

test('helpers for limits', () => {
  assert.equal(planValue(plans[2], 'GIOI_HAN_THE'), Infinity);
  assert.equal(nextPlanFor(plans, 'GIOI_HAN_THE', 'FREE').ma, 'PRO');
  assert.equal(lowestPlanFor(plans, 'AI').ma, 'FREE');
  assert.equal(usageLevel(250, 300), 'near');
  assert.equal(usageLevel(300, 300), 'full');
  assert.equal(usageLevel(10, null), 'ok');
  assert.equal(formatLimit(null), 'Không giới hạn');
  assert.equal(formatLimit(5000), '5.000');
});

test('free tier limits: practice quota upgrades to Pro and advanced stats is a Pro flag', () => {
  const tiers = plans.map(p => ({ ...p, hanMucLuyenTap: { FREE: 5, PRO: 50, PREMIUM: 200 }[p.ma], thongKeNangCao: p.ma !== 'FREE' }));
  const practice = access({ plans: tiers, planCode: 'FREE', quota: { hanMuc: [{ loai: 'LUYEN_TAP', gioiHan: 5, conLai: 0 }] }, feature: 'LUYEN_TAP' });
  assert.equal(practice.exhausted, true);
  assert.equal(practice.upgrade.ma, 'PRO');
  const stats = access({ plans: tiers, planCode: 'FREE', feature: 'THONG_KE_NANG_CAO' });
  assert.equal(stats.locked, true);
  assert.equal(stats.required.ma, 'PRO');
  assert.equal(access({ plans: tiers, planCode: 'PRO', feature: 'THONG_KE_NANG_CAO' }).locked, false);
  const denied = upgradeFromError(422, { message: 'x', details: { quyenLoi: 'THONG_KE_NANG_CAO', goiCanNangCap: 'PRO' } }, tiers, 'FREE');
  assert.equal(denied.target.ma, 'PRO');
  const limited = upgradeFromError(429, { message: 'x', details: { quyenLoi: 'HAN_MUC', loai: 'LUYEN_TAP', gioiHan: 5 } }, tiers, 'FREE');
  assert.equal(limited.reason, 'HET_LUOT');
  assert.equal(limited.target.ma, 'PRO');
});
