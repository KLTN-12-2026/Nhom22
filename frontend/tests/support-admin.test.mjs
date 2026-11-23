import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readAdminTickets, filterAdminTickets, saveSupportUpdate, validateSupportUpdate } from '../src/lib/support-admin.mjs';
import { readTickets, saveTicket } from '../src/lib/support-tickets.mjs';

function memoryStorage() {
  const data = new Map();
  return { get length() { return data.size; }, key: index => [...data.keys()][index] ?? null,
    getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
const admin = { id: 'admin', tenHienThi: 'Quản trị viên', vaiTro: ['ADMIN'] };
const learner = { id: 'learner-id', tenHienThi: 'Trần Bình', email: 'binh@example.test' };
const values = { title: 'Cần kiểm tra giao dịch', description: 'Đã thanh toán VNPay.', category: 'payment', priority: 'critical' };
const update = { message: 'Đã kiểm tra và hướng dẫn học viên.', status: 'resolved', priority: 'high' };

test('admin aggregates student records with requester identity, keeps duplicate ticket IDs distinct, and searches/sorts', () => {
  const storage = memoryStorage();
  saveTicket(storage, learner.id, values, learner);
  const another = { ...learner, id: 'another-id', email: 'another@example.test' };
  saveTicket(storage, another.id, values, another);
  const entries = readAdminTickets(storage);
  const found = filterAdminTickets(entries, { search: learner.email });
  assert.equal(found.length, 13);
  assert.equal(found[0].owner.tenHienThi, learner.tenHienThi);
  assert.equal(new Set(entries.map(entry => entry.key)).size, entries.length);
  assert.equal(filterAdminTickets(entries, { search: 'TRAN BINH', category: 'payment', priority: 'critical', status: 'open' }).length, 4);
  assert.equal(filterAdminTickets(entries, { sort: 'priority' })[0].ticket.priority, 'critical');
  const oldest = filterAdminTickets(entries, { sort: 'oldest' });
  assert.ok(Date.parse(oldest[0].ticket.createdAt) <= Date.parse(oldest.at(-1).ticket.createdAt));
  assert.equal(filterAdminTickets(entries, { search: 'HT-1043' }).length, 2);
  assert.equal(filterAdminTickets(entries, { search: 'not-found' }).length, 0);
});

test('reply, resolve, reopen, and priority changes persist in the same student store without modifying other accounts', () => {
  const storage = memoryStorage();
  saveTicket(storage, learner.id, values, learner);
  let selected = readAdminTickets(storage).find(entry => entry.ownerId === learner.id && entry.ticket.id === 'HT-1043');
  saveSupportUpdate(storage, selected, update, admin);
  let saved = readTickets(storage, learner.id)[0];
  assert.equal(saved.status, 'resolved'); assert.equal(saved.priority, 'high');
  assert.equal(saved.history[0].message, update.message);
  assert.equal(saved.history[0].author, admin.tenHienThi);
  assert.deepEqual(saved.requester, learner);
  assert.equal(readTickets(storage, '2')[0].status, 'open');
  selected = readAdminTickets(storage).find(entry => entry.key === selected.key);
  saveSupportUpdate(storage, selected, { message: '', status: 'open', priority: 'medium' }, admin);
  saved = readTickets(storage, learner.id)[0];
  assert.equal(saved.history.length, 2); assert.equal(saved.status, 'open');
  saveTicket(storage, learner.id, values, learner);
  assert.equal(readTickets(storage, learner.id)[1].history.length, 2);
});

test('stale updates and failed writes never overwrite newer data or append a reply twice', () => {
  const storage = memoryStorage();
  const snapshot = readAdminTickets(storage)[0];
  saveSupportUpdate(storage, snapshot, update, admin);
  const stored = readTickets(storage, '2');
  assert.throws(() => saveSupportUpdate(storage, snapshot, { ...update, message: 'Stale' }, admin), { code: 'SUPPORT_CONFLICT' });
  assert.deepEqual(readTickets(storage, '2'), stored);
  const fresh = readAdminTickets(storage)[0];
  const failing = { ...storage, setItem() { throw new Error('Quota exceeded'); } };
  assert.throws(() => saveSupportUpdate(failing, fresh, { ...update, message: 'Retry' }, admin), /Quota exceeded/);
  assert.deepEqual(readTickets(storage, '2'), stored);
});

test('resolve requires an answer; no-op, overlong, invalid and unauthorized updates are rejected', () => {
  const storage = memoryStorage();
  const selected = readAdminTickets(storage)[0];
  assert.match(validateSupportUpdate(selected.ticket, { ...update, message: '  ' }), /kết quả xử lý/);
  assert.match(validateSupportUpdate(selected.ticket, { message: '', status: selected.ticket.status, priority: selected.ticket.priority }), /Nhập phản hồi/);
  assert.match(validateSupportUpdate(selected.ticket, { ...update, message: 'x'.repeat(2001) }), /2000/);
  assert.throws(() => saveSupportUpdate(storage, selected, { ...update, status: 'unknown' }, admin));
  assert.throws(() => saveSupportUpdate(storage, selected, update, { vaiTro: ['USER'] }), /quản trị viên/);
  assert.equal(storage.length, 0);
});
