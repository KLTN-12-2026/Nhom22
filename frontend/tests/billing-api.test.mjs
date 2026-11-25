import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = file => readFile(new URL(file, import.meta.url), 'utf8');
const url = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const apiUrl = url(await read('../src/lib/api-client.js'));
const pagesUrl = url((await read('../src/lib/fetch-all-pages.js')).replace("'@/lib/api-client'", JSON.stringify(apiUrl)));
const billing = await import(url((await read('../src/lib/billing-api.js')).replace("'./api-client'", JSON.stringify(apiUrl)).replace("'./fetch-all-pages'", JSON.stringify(pagesUrl))));
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

test('admin billing collects every backend page and preserves server amounts, versions and expiry', async () => {
  const requests = [];
  globalThis.fetch = async (path, options) => {
    requests.push(path);
    assert.equal(options.credentials, 'include');
    if (path.includes('/plans')) return Response.json([{ ma: 'PRO', ten: 'Pro cập nhật', giaThang: 350000, giaNam: 3500000, gioiHanThe: null, phatAm: true, hoatDong: true, version: 4 }]);
    if (path.includes('/subscriptions')) return Response.json({ items: [{ id: '9', tenHienThi: 'An', goiMa: 'PRO', trangThai: 'HIEU_LUC', hetHanAt: '2099-01-01T00:00:00Z', soNgayConLai: 3 }], totalPages: 1 });
    return Response.json({ items: [{ maDon: path.includes('page=1') ? 'ORDER-2' : 'ORDER-1', soTien: 123456, goiMa: 'PRO', tenGoi: 'Pro', trangThai: 'THANH_CONG', taoAt: '2026-11-17T02:00:00Z' }], totalPages: 2 });
  };
  const data = await billing.loadAdminBilling();
  assert.deepEqual(data.transactions.map(t => t.id), ['ORDER-1', 'ORDER-2']);
  assert.equal(data.transactions[0].amount, 123456);
  assert.equal(data.plans[0].month, 350000);
  assert.equal(data.plans[0].version, 4);
  assert.equal(billing.isSoon(data.subscriptions[0]), true);
  assert.equal(requests.length, 4);
});

test('backend errors propagate without falling back to demo payment data', async () => {
  globalThis.fetch = async () => Response.json({ message: 'Không có quyền' }, { status: 403 });
  await assert.rejects(billing.loadAdminBilling(), error => error.status === 403);
});

test('plan update uses backend field names, nullable card limit and unchanged concurrency version', () => {
  const payload = billing.planPayload({ name: 'Pro', month: 100000, year: 1000000, cards: null, speech: true, active: true, version: 0, ai: 99 });
  assert.deepEqual(payload, { ten: 'Pro', giaThang: 100000, giaNam: 1000000, gioiHanThe: null, phatAm: true, hoatDong: true, version: 0 });
});

test('live CSV exports supplied records, with formula protection and Vietnam time', () => {
  const csv = billing.paymentsCsv([{ id: 'ORDER-1', email: '=SUM(1)', plan: 'PRO', cycle: 'THANG', amount: 123456, status: 'THANH_CONG', created: '2026-11-17T23:00:00Z' }]);
  assert.ok(csv.includes("'=SUM(1)"));
  assert.ok(csv.includes('18/11/2026 06:00'));
  assert.equal(csv.split('\r\n').length, 2);
});

test('cancellation posts the displayed registration and version with CSRF, preserving server response', async () => {
  const requests = [];
  globalThis.fetch = async (path, options) => {
    requests.push({ path, options });
    if (path.endsWith('/csrf')) return Response.json({ headerName: 'X-XSRF-TOKEN', token: 'cancel-csrf' });
    return Response.json({ id: '9007199254740993', trangThai: 'DA_HUY', version: 1, huyAt: '2026-11-17T03:00:00Z' });
  };
  const result = await billing.cancelSubscription({ id: '9007199254740993', version: 0, goiMa: 'PRO' });
  const request = requests.at(-1);
  assert.equal(request.path, '/api/v1/me/subscription/cancel');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.credentials, 'include');
  assert.equal(request.options.headers.get('X-XSRF-TOKEN'), 'cancel-csrf');
  assert.deepEqual(JSON.parse(request.options.body), { id: '9007199254740993', version: 0 });
  assert.equal(result.trangThai, 'DA_HUY');
  globalThis.fetch = async () => Response.json({ message: 'Gói đã thay đổi' }, { status: 409 });
  await assert.rejects(billing.cancelSubscription({ id: '9', version: 1 }), error => error.status === 409);
});

test('cancelled registrations are excluded from active, expiring and expired subscriptions', () => {
  for (const expiry of ['2000-01-01T00:00:00Z', '2099-01-01T00:00:00Z']) {
    const cancelled = { status: 'DA_HUY', expiry, days: 1 };
    assert.equal(billing.isActiveSubscription(cancelled), false);
    assert.equal(billing.isSoon(cancelled), false);
    assert.equal(billing.isExpired(cancelled), false);
    assert.deepEqual(billing.subscriptionStatus(cancelled), ['Đã hủy', 'failed']);
  }
});
