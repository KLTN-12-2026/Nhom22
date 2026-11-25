import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardListParams, parseCardSort } from '../src/lib/card-list.mjs';

test('default list keeps only paging and the focus card', () => {
  assert.equal(cardListParams({ page: 2, focusId: '5' }), 'page=2&size=20&theId=5');
});

test('search and sort are sent and disable card focus', () => {
  assert.equal(cardListParams({ search: '  run ', sort: 'TU_AZ', focusId: '5' }), 'page=0&size=20&q=run&sapXep=TU_AZ');
});

test('unknown sort falls back to newest', () => {
  assert.equal(parseCardSort('x'), 'MOI_NHAT');
  assert.equal(parseCardSort('TU_ZA'), 'TU_ZA');
});
