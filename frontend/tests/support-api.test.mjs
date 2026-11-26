import { afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Load the same transport used by both screens without Next.js alias resolution.
const modules = new Map();
async function moduleUrl(path) {
  if (modules.has(path)) return modules.get(path);
  let source = await readFile(new URL(`../src/lib/${path}`, import.meta.url), 'utf8');
  const imports = [...source.matchAll(/from ['"]([^'"]+)['"]/g)];
  for (const [, specifier] of imports) {
    const dependency = specifier.replace(/^@\/lib\//, '').replace(/^\.\//, '');
    const url = await moduleUrl(/\.(js|mjs)$/.test(dependency) ? dependency : `${dependency}.js`);
    source = source.replaceAll(`'${specifier}'`, `'${url}'`);
  }
  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  modules.set(path, url);
  return url;
}
const { listSupportTickets, createSupportTicket, listAdminSupportTickets, respondToSupportTicket } = await import(await moduleUrl('support-api.js'));
const { resetCsrf } = await import(await moduleUrl('api-client.js'));
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; resetCsrf(); });

const apiTicket = (id, extra = {}) => ({
  id: String(id), tieuDe: 'Cần hỗ trợ', moTa: 'Không mở được bài học', loaiVanDe: 'KY_THUAT',
  doUuTien: 'TRUNG_BINH', trangThai: 'DANG_MO', version: 0,
  createdAt: '2026-11-25T02:00:00Z', updatedAt: '2026-11-25T02:00:00Z', phanHoi: [], ...extra,
});

test('student list loads every backend page with the session cookie', async () => {
  const calls = [];
  globalThis.fetch = async (path, options) => {
    calls.push(path);
    assert.equal(options.credentials, 'include');
    const url = new URL(path, 'http://localhost');
    assert.equal(url.pathname, '/api/v1/support-tickets');
    assert.equal(url.searchParams.get('size'), '100');
    return Response.json({ items: [apiTicket(calls.length)], totalPages: 2 });
  };
  const result = await listSupportTickets();
  assert.equal(calls.length, 2);
  assert.equal(new URL(calls[1], 'http://localhost').searchParams.get('page'), '1');
  assert.deepEqual(result.map(ticket => ticket.id), ['HT-1', 'HT-2']);
});

test('create sends backend fields with CSRF and uses the saved server ticket', async () => {
  const calls = [];
  globalThis.fetch = async (path, options) => {
    calls.push(path);
    if (path.endsWith('/auth/csrf')) return Response.json({ headerName: 'X-CSRF-TOKEN', token: 'csrf-test' });
    assert.equal(path, '/api/v1/support-tickets');
    assert.equal(options.method, 'POST');
    assert.equal(options.credentials, 'include');
    assert.equal(options.headers.get('X-CSRF-TOKEN'), 'csrf-test');
    assert.equal(options.headers.get('Content-Type'), 'application/json');
    assert.deepEqual(JSON.parse(options.body), { tieuDe: 'Học phí', moTa: 'Đã thanh toán', loaiVanDe: 'THANH_TOAN', doUuTien: 'CAO' });
    return Response.json(apiTicket(42, { tieuDe: 'Học phí', loaiVanDe: 'THANH_TOAN', doUuTien: 'CAO' }), { status: 201 });
  };
  const ticket = await createSupportTicket({ title: ' Học phí ', description: ' Đã thanh toán ', category: 'payment', priority: 'high' });
  assert.deepEqual(calls, ['/api/v1/auth/csrf', '/api/v1/support-tickets']);
  assert.equal(ticket.rawId, '42');
  assert.equal(ticket.category, 'payment');
  assert.equal(ticket.priority, 'high');
});

test('admin list receives requester information and the full response history', async () => {
  globalThis.fetch = async path => {
    assert.equal(path, '/api/v1/admin/support-tickets?size=100');
    return Response.json({ items: [apiTicket(42, {
      nguoiDung: { id: '7', tenHienThi: 'Nguyễn An', email: 'an@example.test' },
      phanHoi: [{ nguoiXuLy: 'Quản trị', noiDung: '', hanhDong: 'Ưu tiên: Cao', createdAt: '2026-11-25T03:00:00Z' }],
    })], totalPages: 1 });
  };
  const [entry] = await listAdminSupportTickets();
  assert.equal(entry.owner.email, 'an@example.test');
  assert.equal(entry.ticket.history[0].action, 'Ưu tiên: Cao');
});

test('admin response sends version and maps the updated ticket returned by backend', async () => {
  globalThis.fetch = async (path, options) => {
    if (path.endsWith('/csrf')) return Response.json({ headerName: 'X-CSRF-TOKEN', token: 't' });
    assert.equal(path, '/api/v1/admin/support-tickets/42/respond');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { noiDung: 'Đã xử lý', trangThai: 'DA_GIAI_QUYET', doUuTien: 'THAP', version: 3 });
    return Response.json(apiTicket(42, { version: 4, trangThai: 'DA_GIAI_QUYET', doUuTien: 'THAP' }));
  };
  const entry = await respondToSupportTicket({ rawId: '42', version: 3 }, { message: ' Đã xử lý ', status: 'resolved', priority: 'low' });
  assert.equal(entry.ticket.version, 4);
  assert.equal(entry.ticket.status, 'resolved');
});

test('a failed later page does not return a misleading partial list', async () => {
  globalThis.fetch = async path => path.includes('page=1')
    ? Response.json({ message: 'Không tải được trang tiếp theo' }, { status: 503 })
    : Response.json({ items: [apiTicket(1)], totalPages: 2 });
  await assert.rejects(listSupportTickets(), error => error.status === 503);
});

test('version conflict and create rate limit preserve backend errors without replaying writes', async () => {
  let writes = 0;
  globalThis.fetch = async path => {
    if (path.endsWith('/csrf')) return Response.json({ headerName: 'X-CSRF-TOKEN', token: 't' });
    writes++;
    return path.endsWith('/respond')
      ? Response.json({ code: 'VERSION_CONFLICT', message: 'Phiếu đã thay đổi' }, { status: 409 })
      : Response.json({ message: 'Vui lòng thử lại sau' }, { status: 429, headers: { 'Retry-After': '60' } });
  };
  await assert.rejects(respondToSupportTicket({ rawId: '42', version: 0 }, { message: 'x', status: 'open', priority: 'high' }), error => error.code === 'VERSION_CONFLICT' && error.status === 409);
  await assert.rejects(createSupportTicket({ title: 'x', description: 'y', category: 'other', priority: 'low' }), error => error.status === 429 && error.retryAfter === 60);
  assert.equal(writes, 2);
});
