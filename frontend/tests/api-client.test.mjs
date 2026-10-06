import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/lib/api-client.js', import.meta.url), 'utf8');
const { apiFetch, resetCsrf, applyServerErrors, ApiError } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; resetCsrf(); });
test('writes acquire one CSRF token, include cookies and preserve custom headers', async () => {
  const calls = [];
  globalThis.fetch = async (path, options) => {
    calls.push({ path, options });
    return path.endsWith('/csrf') ? Response.json({ headerName: 'X-XSRF-TOKEN', token: 'token-1' }) : new Response(null, { status: 204 });
  };
  await Promise.all([apiFetch('/api/v1/decks/1/favorite', { method: 'PUT', headers: { 'X-Test': 'kept' } }), apiFetch('/api/v1/me', { method: 'PATCH', body: JSON.stringify({ tenHienThi: 'An' }) })]);
  assert.equal(calls.filter(c => c.path.endsWith('/csrf')).length, 1);
  const favorite = calls.find(c => c.path.endsWith('/favorite'));
  assert.equal(favorite.options.headers.get('X-Test'), 'kept');
  assert.equal(favorite.options.headers.get('X-XSRF-TOKEN'), 'token-1');
  assert.equal(favorite.options.credentials, 'include');
});
test('login rotates CSRF before the next authenticated write', async () => {
  let tokens = 0;
  globalThis.fetch = async path => path.endsWith('/csrf') ? Response.json({ headerName: 'X-CSRF', token: `token-${++tokens}` }) : Response.json({ id: '1' });
  await apiFetch('/api/v1/auth/login', { method: 'POST', body: '{}' });
  await apiFetch('/api/v1/decks', { method: 'POST', body: '{}' });
  assert.equal(tokens, 2);
});
test('empty 200/204 replies do not cause JSON parsing failures', async () => {
  globalThis.fetch = async () => new Response(null, { status: 200 });
  assert.equal(await apiFetch('/api/v1/me/avatar'), null);
});
test('validation and conflict errors retain traceId and field errors without replaying writes', async () => {
  let writes = 0;
  globalThis.fetch = async path => path.endsWith('/csrf') ? Response.json({ headerName: 'X-CSRF', token: 't' }) : (writes++, Response.json({ message: 'Dữ liệu chưa hợp lệ', traceId: 'trace-1', fieldErrors: [{ field: 'version', message: 'Tải lại phiên bản' }] }, { status: 409 }));
  await assert.rejects(apiFetch('/api/v1/decks/1', { method: 'PATCH', body: '{}' }), error => error instanceof ApiError && error.status === 409 && error.traceId === 'trace-1' && error.message.includes('Tải lại phiên bản'));
  assert.equal(writes, 1);
  const errors = [];
  applyServerErrors((...args) => errors.push(args), [{ field: 'ten', message: 'Nhập tên' }]);
  assert.equal(errors[0][0], 'ten');
  assert.equal(errors[0][1].message, 'Nhập tên');
});
test('network failures produce a user-facing API error', async () => {
  globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(apiFetch('/api/v1/me'), error => error instanceof ApiError && error.status === 0);
});
