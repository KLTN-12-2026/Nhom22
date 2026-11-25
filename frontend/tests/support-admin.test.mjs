import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterAdminTickets, toAdminEntry, toApiRespond, validateSupportUpdate } from '../src/lib/support-admin.mjs';

const api = (id, over = {}) => ({
  id: String(id), version: 2, tieuDe: 'Cần kiểm tra giao dịch', moTa: 'Đã thanh toán VNPay', loaiVanDe: 'THANH_TOAN',
  doUuTien: 'NGHIEM_TRONG', trangThai: 'DANG_MO', createdAt: `2026-11-2${id}T02:30:00Z`, updatedAt: `2026-11-2${id}T02:30:00Z`,
  nguoiDung: { id: '9', tenHienThi: 'Trần Bình', email: 'binh@example.test' }, phanHoi: [], ...over,
});
const update = { message: 'Đã kiểm tra và hướng dẫn học viên.', status: 'resolved', priority: 'high' };

test('admin entries carry requester identity and support search, filter and sort', () => {
  const entries = [api(1), api(2, { doUuTien: 'THAP', nguoiDung: { id: '8', tenHienThi: 'Lê An', email: '' } })].map(toAdminEntry);
  assert.equal(filterAdminTickets(entries, { search: 'binh@example.test' }).length, 1);
  assert.equal(filterAdminTickets(entries, { search: 'LE AN' })[0].owner.id, '8');
  assert.equal(filterAdminTickets(entries, { sort: 'priority' })[0].ticket.priority, 'critical');
  assert.equal(filterAdminTickets(entries, { sort: 'oldest' })[0].key, '1');
  assert.equal(filterAdminTickets(entries, { search: 'HT-1' }).length, 1);
});

test('respond payload maps enums and carries the ticket version', () => {
  const { ticket } = toAdminEntry(api(1));
  assert.deepEqual(toApiRespond(ticket, update), { noiDung: 'Đã kiểm tra và hướng dẫn học viên.', trangThai: 'DA_GIAI_QUYET', doUuTien: 'CAO', version: 2 });
});

test('resolve requires an answer; no-op, overlong and invalid updates are rejected', () => {
  const { ticket } = toAdminEntry(api(1));
  assert.match(validateSupportUpdate(ticket, { ...update, message: '  ' }), /kết quả xử lý/);
  assert.match(validateSupportUpdate(ticket, { message: '', status: ticket.status, priority: ticket.priority }), /Nhập phản hồi/);
  assert.match(validateSupportUpdate(ticket, { ...update, message: 'x'.repeat(2001) }), /2000/);
  assert.match(validateSupportUpdate(ticket, { ...update, status: 'unknown' }), /hợp lệ/);
  assert.equal(validateSupportUpdate(ticket, update), '');
});
