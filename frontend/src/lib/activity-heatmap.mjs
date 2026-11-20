export const ACTIVITY_METRICS = [
  { key: 'soLuotOn', label: 'Lượt ôn', unit: 'lượt ôn', hue: 'var(--warning)' },
  { key: 'soCauLuyen', label: 'Luyện tập', unit: 'câu luyện tập', hue: 'var(--edit)' },
  { key: 'soPhut', label: 'Phút học', unit: 'phút học', hue: 'var(--secondary)' },
  { key: 'soCongKhai', label: 'Đóng góp công khai', unit: 'bộ được công khai', hue: 'var(--primary)' },
];

export const DEFAULT_METRIC = 'soLuotOn';
export const metricOf = key => ACTIVITY_METRICS.find(m => m.key === key) || ACTIVITY_METRICS[0];

const parseDay = value => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const weekday = value => (parseDay(value).getUTCDay() + 6) % 7;

export function buildWeeks(days) {
  const weeks = [];
  let week = null;
  for (const day of days || []) {
    const row = weekday(day.ngay);
    if (!week || row === 0) {
      week = new Array(7).fill(null);
      weeks.push(week);
    }
    week[row] = day;
  }
  return weeks;
}

export function monthLabels(weeks) {
  const labels = [];
  let last = -1;
  weeks.forEach((week, index) => {
    const first = week.find(Boolean);
    if (!first) return;
    const month = parseDay(first.ngay).getUTCMonth();
    if (month !== last) {
      labels.push({ index, text: `Th${month + 1}` });
      last = month;
    }
  });
  return labels.filter((label, i) => i === labels.length - 1 || labels[i + 1].index - label.index >= 2);
}

export function thresholds(values) {
  const nonZero = values.filter(v => v > 0).sort((a, b) => a - b);
  if (!nonZero.length) return [1, 1, 1];
  const at = p => nonZero[Math.min(nonZero.length - 1, Math.floor(p * nonZero.length))];
  return [at(0.25), at(0.5), at(0.75)];
}

export function levelOf(value, limits) {
  if (!value || value <= 0) return 0;
  if (value <= limits[0]) return 1;
  if (value <= limits[1]) return 2;
  if (value <= limits[2]) return 3;
  return 4;
}

export function summarize(days, key) {
  let total = 0;
  let active = 0;
  let longest = 0;
  let run = 0;
  for (const day of days || []) {
    const value = day[key] || 0;
    total += value;
    if (value > 0) {
      active += 1;
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }
  const list = days || [];
  let current = 0;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if ((list[i][key] || 0) > 0) current += 1;
    else if (i === list.length - 1) continue;
    else break;
  }
  return { total, active, longest, current };
}
