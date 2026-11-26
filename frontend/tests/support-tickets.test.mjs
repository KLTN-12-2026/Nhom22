import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterTickets, fromApiTicket, toApiCreate, validateTicket } from '../src/lib/support-tickets.mjs';

const api = (id, over = {}) => ({
  id: String(id), version: 0, tieuDe: 'Thanh toán VNPay chưa kích hoạt', moTa: 'Gói Pro chưa hiển thị', loaiVanDe: 'THANH_TOAN',
  doUuTien: 'NGHIEM_TRONG', trangThai: 'DANG_MO', createdAt: `2026-11-2${id}T02:30:00Z`, updatedAt: `2026-11-2${id}T02:30:00Z`,
  phanHoi: [], ...over,
});

test('API tickets map to FE keys and replies map to history', () => {
  const ticket = fromApiTicket(api(3, { phanHoi: [{ id: '1', nguoiXuLy: 'Admin', noiDung: 'Đã xử lý', hanhDong: 'Trạng thái: Đã giải quyết', createdAt: '2026-11-23T03:00:00Z' }] }));
  assert.equal(ticket.id, 'HT-3');
  assert.equal(ticket.rawId, '3');
  assert.deepEqual([ticket.category, ticket.priority, ticket.status], ['payment', 'critical', 'open']);
  assert.deepEqual(ticket.history[0], { author: 'Admin', message: 'Đã xử lý', action: 'Trạng thái: Đã giải quyết', createdAt: '2026-11-23T03:00:00Z' });
});

test('create payload trims fields and uses API enums', () => {
  assert.deepEqual(toApiCreate({ title: '  A  ', description: ' B ', category: 'academic', priority: 'low' }),
    { tieuDe: 'A', moTa: 'B', loaiVanDe: 'HOC_VU', doUuTien: 'THAP' });
});

test('search ignores accents and combines filters, newest first', () => {
  const tickets = [api(1), api(2, { tieuDe: 'Không nghe được âm thanh', moTa: 'Chrome', loaiVanDe: 'KY_THUAT', doUuTien: 'CAO' }),
    api(3, { trangThai: 'DA_GIAI_QUYET' })].map(fromApiTicket);
  assert.equal(filterTickets(tickets, { search: 'AM THANH' })[0].id, 'HT-2');
  assert.equal(filterTickets(tickets, { category: 'payment', status: 'open' }).length, 1);
  assert.equal(filterTickets(tickets)[0].id, 'HT-3');
});

test('blank or overlong values are rejected', () => {
  assert.ok(validateTicket({ title: ' ', description: 'x' }).title);
  assert.ok(validateTicket({ title: 'x'.repeat(151), description: 'x' }).title);
  assert.ok(validateTicket({ title: 'x', description: ' ' }).description);
  assert.deepEqual(validateTicket({ title: 'x', description: 'y' }), {});
});

test('description accepts the API limit and rejects larger payloads', () => {
  assert.deepEqual(validateTicket({ title: 'x'.repeat(150), description: 'y'.repeat(5000), category: 'technical', priority: 'medium' }), {});
  assert.match(validateTicket({ title: 'x', description: 'y'.repeat(5001) }).description, /5000/);
});

test('invalid category and priority cannot produce an API create request', () => {
  const errors = validateTicket({ title: 'x', description: 'y', category: 'unknown', priority: '' });
  assert.ok(errors.category);
  assert.ok(errors.priority);
});
