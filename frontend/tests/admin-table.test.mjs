import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllPages, nextSort, rangeText, runSequential, setParams, sortRows, toCsv } from '../src/lib/admin-table.mjs';

test('sortRows sorts Vietnamese text and numbers, keeps empty values last and stays stable', () => {
  const rows = [{ n: 'Đức', v: 3 }, { n: 'an', v: null }, { n: 'Bình', v: 10 }, { n: 'ân', v: 3 }];
  assert.deepEqual(sortRows(rows, { sortValue: r => r.n }).map(r => r.n), ['an', 'ân', 'Bình', 'Đức']);
  assert.deepEqual(sortRows(rows, { sortValue: r => r.v }, 'desc').map(r => r.n), ['Bình', 'Đức', 'ân', 'an']);
  assert.equal(sortRows(rows, {}), rows);
});

test('nextSort cycles ascending, descending, off', () => {
  assert.deepEqual(nextSort(null, 'a'), { key: 'a', direction: 'asc' });
  assert.deepEqual(nextSort({ key: 'a', direction: 'asc' }, 'a'), { key: 'a', direction: 'desc' });
  assert.equal(nextSort({ key: 'a', direction: 'desc' }, 'a'), null);
  assert.deepEqual(nextSort({ key: 'a', direction: 'desc' }, 'b'), { key: 'b', direction: 'asc' });
});

test('toCsv adds a BOM, quotes separators and neutralises formulas', () => {
  const csv = toCsv([{ header: 'Tên', csv: r => r.ten }, { header: 'Ghi chú', csv: r => r.note }, { header: 'Bỏ qua' }], [{ ten: 'An, Bình', note: '=SUM(A1)' }, { ten: 'Chi "C"', note: null }]);
  assert.equal(csv, '﻿Tên,Ghi chú\r\n"An, Bình",\'=SUM(A1)\r\n"Chi ""C""",');
});

test('rangeText describes the visible slice', () => {
  assert.equal(rangeText(0, 20, 0), '0 kết quả');
  assert.equal(rangeText(1, 20, 45), '21–40 / 45');
  assert.equal(rangeText(2, 20, 45), '41–45 / 45');
});

test('fetchAllPages walks every page and respects the limit', async () => {
  const calls = [];
  const fetchPage = async (page, size) => { calls.push([page, size]); return { items: [page * 2, page * 2 + 1], totalPages: 3 }; };
  assert.deepEqual(await fetchAllPages(fetchPage, { size: 2 }), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(calls, [[0, 2], [1, 2], [2, 2]]);
  assert.deepEqual(await fetchAllPages(fetchPage, { size: 2, limit: 3 }), [0, 1, 2]);
});

test('runSequential keeps going after a failure and reports both lists', async () => {
  const result = await runSequential([1, 2, 3], async n => { if (n === 2) throw new Error('x'); return n * 10; });
  assert.deepEqual(result.ok.map(r => r.result), [10, 30]);
  assert.deepEqual(result.failed.map(r => r.item), [2]);
});

test('setParams drops empty values and resets the page unless it is set', () => {
  assert.equal(setParams('q=an&page=3', { trangThai: 'BI_KHOA' }), '?q=an&trangThai=BI_KHOA');
  assert.equal(setParams('q=an&page=3', { q: '' }), '');
  assert.equal(setParams('q=an', { page: 2 }), '?q=an&page=2');
});
