import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterTickets, readTickets, sampleTickets, saveTicket, validateTicket } from '../src/lib/support-tickets.mjs';

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
const values = { title: '  Kiểm tra giao diện  ', description: '  Mô tả vấn đề  ', category: 'technical', priority: 'high' };

test('search ignores Vietnamese accents and case, searches descriptions, and combines filters', () => {
  const tickets = sampleTickets();
  assert.equal(filterTickets(tickets, { search: 'DIEU CHINH' })[0].category, 'academic');
  assert.equal(filterTickets(tickets, { search: 'vnpay' })[0].priority, 'critical');
  assert.equal(filterTickets(tickets, { category: 'technical', priority: 'high', status: 'open' }).length, 2);
  assert.equal(filterTickets(tickets, { search: 'vnpay', status: 'resolved' }).length, 0);
  const reversed = [...tickets].reverse();
  assert.equal(filterTickets(reversed)[0].id, 'HT-1042');
  assert.equal(reversed[0].id, tickets.at(-1).id);
});

test('creating a ticket trims fields, persists through reloads and isolates accounts', () => {
  const storage = memoryStorage();
  const updated = saveTicket(storage, 'learner-a', values);
  assert.equal(updated.length, 13);
  assert.equal(updated[0].title, 'Kiểm tra giao diện');
  assert.equal(updated[0].description, 'Mô tả vấn đề');
  assert.equal(updated[0].status, 'open');
  assert.equal(updated[0].id, 'HT-1043');
  assert.deepEqual(readTickets(storage, 'learner-a'), updated);
  assert.equal(readTickets(storage, 'learner-b').length, 12);
  assert.equal(saveTicket(storage, 'learner-a', values)[0].id, 'HT-1044');
});

test('corrupt, duplicate and inaccessible storage fall back safely to sample tickets', () => {
  for (const saved of ['{invalid', '{}', JSON.stringify([{ ...sampleTickets()[0], status: 'unknown' }]), JSON.stringify([sampleTickets()[0], sampleTickets()[0]])]) {
    assert.deepEqual(readTickets({ getItem: () => saved }, 'a'), sampleTickets());
  }
  assert.deepEqual(readTickets({ getItem() { throw new Error('Denied'); } }, 'a'), sampleTickets());
  assert.deepEqual(readTickets({ getItem: () => '[]' }, 'a'), []);
});

test('failed storage writes propagate and leave saved data unchanged', () => {
  const storage = memoryStorage();
  const saved = saveTicket(storage, 'a', values);
  assert.throws(() => saveTicket({ ...storage, setItem() { throw new Error('Quota exceeded'); } }, 'a', values), /Quota exceeded/);
  assert.deepEqual(readTickets(storage, 'a'), saved);
});

test('blank, overlong or invalid form values cannot be saved', () => {
  assert.deepEqual(Object.keys(validateTicket({ title: '   ', description: '\n' })), ['title', 'description']);
  assert.match(validateTicket({ title: 'x'.repeat(151), description: 'Valid' }).title, /150/);
  const storage = memoryStorage();
  for (const invalid of [{ ...values, title: ' ' }, { ...values, description: '' }, { ...values, category: 'unknown' }, { ...values, priority: 'urgent' }]) {
    assert.throws(() => saveTicket(storage, 'a', invalid));
  }
  assert.throws(() => saveTicket(storage, null, values));
  assert.equal(readTickets(storage, 'a').length, 12);
});
