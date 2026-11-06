import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deckCopyKey, copyDeck } from '../src/lib/deck-copy.mjs';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
}

test('copy retries and reloads reuse the same user and source key', () => {
  const store = storage();
  assert.equal(deckCopyKey(store, '1', '11', () => 'first'), 'copy-first');
  assert.equal(deckCopyKey(store, '1', '11', () => 'second'), 'copy-first');
  assert.equal(deckCopyKey(store, '2', '11', () => 'other-user'), 'copy-other-user');
  assert.equal(deckCopyKey(store, '1', '12', () => 'other-deck'), 'copy-other-deck');
});

test('copy sends an empty POST and its idempotency header and uses the real response', async () => {
  let call;
  const response = { id: '23', boNguonId: '11', quyenTruyCap: 'RIENG_TU' };
  const result = await copyDeck(async (...args) => { call = args; return response; }, '11', 'copy-first');
  assert.deepEqual(call, ['/api/v1/decks/11/copy', { method: 'POST', headers: { 'Idempotency-Key': 'copy-first' } }]);
  assert.equal(result.id, '23');
});

test('copy failures propagate without silently creating or retrying another request', async () => {
  let calls = 0;
  const failure = new Error('network');
  await assert.rejects(copyDeck(async () => { calls++; throw failure; }, '11', 'same-key'), failure);
  assert.equal(calls, 1);
});
