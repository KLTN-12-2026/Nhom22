import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWeeks, levelOf, metricOf, monthLabels, summarize, thresholds } from '../src/lib/activity-heatmap.mjs';

const day = (ngay, soLuotOn = 0) => ({ ngay, soLuotOn, soCauLuyen: 0, soPhut: 0, soCongKhai: 0 });
const range = (from, count, values = []) => {
  const start = new Date(`${from}T00:00:00Z`);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return day(d.toISOString().slice(0, 10), values[i] || 0);
  });
};

test('buildWeeks starts each column on Monday and leaves future days empty', () => {
  const weeks = buildWeeks(range('2026-10-19', 10));
  assert.equal(weeks.length, 2);
  assert.equal(weeks[0][0].ngay, '2026-10-19');
  assert.equal(weeks[0][6].ngay, '2026-10-25');
  assert.equal(weeks[1][2].ngay, '2026-10-28');
  assert.equal(weeks[1][3], null);
});

test('monthLabels marks the first column of each month and drops a cramped first label', () => {
  const labels = monthLabels(buildWeeks(range('2026-09-28', 42)));
  assert.deepEqual(labels.map(l => l.text), ['Th10', 'Th11']);
  assert.deepEqual(labels.map(l => l.index), [1, 5]);
  assert.deepEqual(monthLabels(buildWeeks(range('2026-09-21', 21))).map(l => l.text), ['Th9', 'Th10']);
});

test('thresholds and levelOf split non-zero values into four levels', () => {
  const limits = thresholds([0, 1, 2, 3, 4, 5, 6, 7, 8, 0]);
  assert.deepEqual(limits, [3, 5, 7]);
  assert.deepEqual([0, 1, 3, 4, 5, 6, 7, 20].map(v => levelOf(v, limits)), [0, 1, 1, 2, 2, 3, 3, 4]);
  assert.deepEqual(thresholds([0, 0]), [1, 1, 1]);
  assert.equal(levelOf(1, thresholds([1])), 1);
});

test('summarize counts total, active days, longest and current streak ignoring an empty today', () => {
  const days = range('2026-10-01', 8, [2, 3, 0, 1, 1, 1, 4, 0]);
  assert.deepEqual(summarize(days, 'soLuotOn'), { total: 12, active: 6, longest: 4, current: 4 });
  assert.deepEqual(summarize(range('2026-10-01', 3, [1, 0, 0]), 'soLuotOn').current, 0);
  assert.equal(metricOf('khong-co').key, 'soLuotOn');
});
