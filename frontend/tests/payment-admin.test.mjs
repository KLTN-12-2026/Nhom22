import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_CLOCK, transactions, createDemo, readDemo, filterPayments,
  isExpired, isSoon, subscriptionStatus, checkExpiries, paymentsCsv, receiptHtml,
} from '../src/lib/payment-admin.mjs';

const filters = { query: '', status: '', plan: '', from: '', to: '' };

test('payment filters combine Vietnamese search, status, plan and inclusive Vietnam dates', () => {
  const rows = filterPayments({ ...filters, query: 'NGUYEN HOAI AN', status: 'THANH_CONG', plan: 'PRO', from: '2026-11-12', to: '2026-11-12' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].email, 'an@example.com');
  assert.equal(filterPayments({ ...filters, from: '2026-11-12', to: '2026-11-11' }).length, 0);
  assert.equal(filterPayments({ ...filters, query: 'khong ton tai' }).length, 0);
  assert.equal(filterPayments({ ...filters, query: 'ĐẶNG NGỌC LINH' }).length, 1);
  assert.equal(filterPayments({ ...filters, query: transactions[0].id }).length, 1);
});

test('expiry uses the fixed Vietnam clock and seven calendar day reminder boundary', () => {
  assert.equal(isExpired({ expiry: DEMO_CLOCK }), true);
  assert.equal(isSoon({ expiry: '2026-11-12T10:01:00+07:00' }), true);
  assert.deepEqual(subscriptionStatus({ expiry: '2026-11-12T10:01:00+07:00' }), ['Hết hạn hôm nay', 'pending']);
  assert.equal(isSoon({ expiry: '2026-11-19T23:59:00+07:00' }), true);
  assert.equal(isSoon({ expiry: '2026-11-20T00:00:00+07:00' }), false);
  assert.equal(isSoon({ expiry: '2026-11-11T23:59:00+07:00' }), false);
});

test('expiry checks are idempotent and keep the reason without mutating the previous state', () => {
  const original = createDemo();
  const first = checkExpiries(original, 'Kiểm tra hết hạn mẫu');
  assert.equal(first.reminders, 2);
  assert.equal(first.expired, 2);
  assert.equal(original.audit.length, 0);
  assert.equal(first.data.audit[0].reason, 'Kiểm tra hết hạn mẫu');
  const repeat = checkExpiries(first.data, 'Kiểm tra lần thứ hai');
  assert.equal(repeat.reminders, 0);
  assert.equal(repeat.expired, 0);
  assert.equal(repeat.data.audit.length, 2);
  first.data.subscriptions[0].expiry = '2026-11-16T09:00:00+07:00';
  assert.equal(checkExpiries(first.data, 'Kiểm tra sau sửa hạn').reminders, 1);
});

test('plan changes cannot change historical transaction amounts or subscriptions', () => {
  const data = createDemo();
  const amount = transactions[0].amount;
  data.plans[0].month = 500000;
  data.plans[0].active = false;
  assert.equal(transactions[0].amount, amount);
  assert.deepEqual(data.subscriptions, createDemo().subscriptions);
  assert.equal(createDemo().plans[0].month, 299000);
});

test('CSV exports the complete filtered result, quotes values and neutralizes formulas', () => {
  const rows = filterPayments({ ...filters, status: 'THANH_CONG' });
  assert.equal(rows.length, 8);
  const csv = paymentsCsv(rows);
  assert.equal(csv.charCodeAt(0), 0xFEFF);
  assert.equal(csv.split('\r\n').length, 9);
  assert.ok(csv.includes('"12/11/2026 09:42"'));
  const unsafe = paymentsCsv([{ ...rows[0], name: ' =HYPERLINK("x"),123' }]);
  assert.ok(unsafe.includes('"\' =HYPERLINK(""x""),123"'));
});

test('only successful transactions get a receipt, with escaped HTML content', () => {
  assert.equal(receiptHtml(transactions.find(t => t.status === 'THAT_BAI')), null);
  const html = receiptHtml({ ...transactions[0], name: '<script>unsafe</script>' });
  assert.ok(html.includes('&lt;script&gt;unsafe&lt;/script&gt;'));
  assert.ok(html.includes('Biên nhận mẫu'));
  assert.ok(!html.includes('<script>'));
});

test('saved demo data survives reload; unavailable, corrupt or invalid storage recovers', () => {
  const data = createDemo();
  data.plans[0].month = 400000;
  data.plans[0].version++;
  const saved = readDemo({ getItem: () => JSON.stringify(data) });
  assert.equal(saved.plans[0].month, 400000);
  for (const value of [null, '{', '{}', JSON.stringify({ ...data, plans: [] }), JSON.stringify({ ...data, subscriptions: [{ id: 'bad' }] })]) {
    assert.deepEqual(readDemo({ getItem: () => value }), createDemo());
  }
  assert.deepEqual(readDemo({ getItem: () => { throw new Error('storage unavailable'); } }), createDemo());
});
