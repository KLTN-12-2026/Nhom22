import { test } from 'node:test';
import assert from 'node:assert/strict';
import { libraryPage, libraryQuery } from '../src/lib/library-query.mjs';

test('library filters use backend field names and encode literal search characters', () => {
  const query = new URLSearchParams(libraryQuery({ q: '  hóa đơn %_!  ', chuDeId: '2', mucTieu: 'TOEIC', trinhDo: 'CO_BAN', nguon: 'MAU', sort: 'size', page: 0, size: 20, goal: 'ignored' }));
  assert.equal(query.get('q'), 'hóa đơn %_!');
  assert.equal(query.get('mucTieu'), 'TOEIC');
  assert.equal(query.get('nguon'), 'MAU');
  assert.equal(query.get('page'), '0');
  assert.equal(query.has('goal'), false);
  assert.equal(query.has('topicId'), false);
});

test('unset onboarding filters are omitted instead of sent as undefined', () => {
  assert.equal(libraryQuery({ nguon: 'MAU', mucTieu: undefined, trinhDo: null, q: '' }), 'nguon=MAU');
});

test('page parsing prevents invalid and excessive offsets from URL input', () => {
  for (const value of ['-1', 'NaN', '1.5', '2147483647']) assert.equal(libraryPage(value), 0);
  assert.equal(libraryPage('2'), 2);
});
