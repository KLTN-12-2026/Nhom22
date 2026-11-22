import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_RATINGS, initialSource, matchedCount, practiceBody, recentPath, recentTotal, resolveSource, toggleRating
} from '../src/lib/practice-recent.mjs';

const summary = { theoDanhGia: { QUEN: 2, KHO: 1, NHO: 3, DE: 0 } };
const empty = { theoDanhGia: { QUEN: 0, KHO: 0, NHO: 0, DE: 0 } };

test('recent source is the default unless the URL picks another', () => {
  assert.equal(initialSource({}), 'VUA_HOC');
  assert.equal(initialSource({ nguon: 'SO_TAY' }), 'SO_TAY');
  assert.equal(initialSource({ boTheId: '7' }), 'deck:7');
  assert.equal(initialSource({ nguon: 'BO_THE' }), '');
});

test('default ratings are forgot, hard and easy in study order', () => {
  assert.deepEqual(DEFAULT_RATINGS, ['QUEN', 'KHO', 'DE']);
  assert.deepEqual(toggleRating(DEFAULT_RATINGS, 'NHO'), ['QUEN', 'KHO', 'NHO', 'DE']);
  assert.deepEqual(toggleRating(['DE', 'QUEN'], 'DE'), ['QUEN']);
});

test('falls back to all decks when nothing was rated recently', () => {
  assert.equal(resolveSource('VUA_HOC', empty), '');
  assert.equal(resolveSource('VUA_HOC', summary), 'VUA_HOC');
  assert.equal(resolveSource('VUA_HOC', undefined), 'VUA_HOC');
  assert.equal(resolveSource('VUA_HOC', empty, { explicit: true }), 'VUA_HOC');
  assert.equal(resolveSource('SO_TAY', empty), 'SO_TAY');
});

test('counts and request body follow the selected ratings', () => {
  assert.equal(recentTotal(summary), 6);
  assert.equal(matchedCount(summary, DEFAULT_RATINGS), 3);
  assert.equal(recentPath(['DE', 'QUEN']), '/api/v1/practice/recent-cards?danhGia=QUEN&danhGia=DE');
  assert.deepEqual(practiceBody({ loaiBai: 'CHON_NGHIA', soCau: '10', source: 'VUA_HOC', ratings: ['KHO', 'QUEN'] }),
    { loaiBai: 'CHON_NGHIA', soCau: 10, nguon: 'VUA_HOC', danhGia: ['QUEN', 'KHO'] });
  assert.deepEqual(practiceBody({ loaiBai: 'CHON_TU', soCau: 5, source: 'deck:9', ratings: [] }),
    { loaiBai: 'CHON_TU', soCau: 5, nguon: 'BO_THE', boTheId: '9' });
  assert.deepEqual(practiceBody({ loaiBai: 'CHON_TU', soCau: 5, source: '', ratings: [] }),
    { loaiBai: 'CHON_TU', soCau: 5, nguon: 'BO_THE', boTheId: null });
});
