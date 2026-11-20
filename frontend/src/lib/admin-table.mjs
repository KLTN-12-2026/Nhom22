const collator = new Intl.Collator('vi', { sensitivity: 'base', numeric: true });

export function compareValues(a, b) {
  const emptyA = a === null || a === undefined || a === '';
  const emptyB = b === null || b === undefined || b === '';
  if (emptyA || emptyB) return emptyA === emptyB ? 0 : emptyA ? 1 : -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date || b instanceof Date) return new Date(a) - new Date(b);
  return collator.compare(String(a), String(b));
}

export function sortRows(rows, column, direction = 'asc') {
  if (!column?.sortValue) return rows;
  const factor = direction === 'desc' ? -1 : 1;
  return rows
    .map((row, index) => ({ row, index }))
    .sort((x, y) => {
      const a = column.sortValue(x.row);
      const b = column.sortValue(y.row);
      const emptyA = a === null || a === undefined || a === '';
      const emptyB = b === null || b === undefined || b === '';
      if (emptyA || emptyB) return emptyA === emptyB ? x.index - y.index : emptyA ? 1 : -1;
      return compareValues(a, b) * factor || x.index - y.index;
    })
    .map(item => item.row);
}

export function nextSort(current, key) {
  if (!current || current.key !== key) return { key, direction: 'asc' };
  if (current.direction === 'asc') return { key, direction: 'desc' };
  return null;
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r;]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

export function toCsv(columns, rows) {
  const usable = columns.filter(column => column.csv);
  const lines = [usable.map(column => csvCell(column.header)).join(',')];
  rows.forEach(row => lines.push(usable.map(column => csvCell(column.csv(row))).join(',')));
  return `﻿${lines.join('\r\n')}`;
}

export function rangeText(page, size, total) {
  if (!total) return '0 kết quả';
  const start = page * size + 1;
  const end = Math.min(total, (page + 1) * size);
  return `${start.toLocaleString('vi-VN')}–${end.toLocaleString('vi-VN')} / ${total.toLocaleString('vi-VN')}`;
}

export async function fetchAllPages(fetchPage, { size = 100, limit = 5000 } = {}) {
  const items = [];
  for (let page = 0; ; page += 1) {
    const data = await fetchPage(page, size);
    items.push(...(data?.items || []));
    const totalPages = data?.totalPages ?? 1;
    if (page + 1 >= totalPages || items.length >= limit) return items.slice(0, limit);
  }
}

export async function runSequential(items, task) {
  const ok = [];
  const failed = [];
  for (const item of items) {
    try {
      ok.push({ item, result: await task(item) });
    } catch (error) {
      failed.push({ item, error });
    }
  }
  return { ok, failed };
}

export function setParams(searchParams, changes, { resetPage = true } = {}) {
  const next = new URLSearchParams(searchParams);
  Object.entries(changes).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') next.delete(key);
    else next.set(key, String(value));
  });
  if (resetPage && !('page' in changes)) next.delete('page');
  const text = next.toString();
  return text ? `?${text}` : '';
}
