export const PERIODS = { THANG: 'Tháng', QUY: 'Quý', NAM: 'Năm' };
export const number = value => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 }).format(value);
export const money = value => `${number(value)} đ`;
export const percent = value => `${number(value)}%`;
export const growthText = value => value == null ? 'Chưa có cơ sở' : `${value > 0 ? '+' : ''}${percent(value)}`;
export const planAmount = (row, code) => row.theoGoi?.[code] ?? 0;
export const rangeLabel = data => data.ky === 'NAM' ? `${data.tuNam}–${data.denNam}` : String(data.nam);
export const vietnamDate = (now = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now);

export function revenueUrl({ period, year, fromYear, toYear }) {
  const params = new URLSearchParams({ ky: period });
  if (period === 'NAM') {
    params.set('tuNam', fromYear);
    params.set('denNam', toYear);
  } else params.set('nam', year);
  return `/api/v1/admin/revenue?${params}`;
}

export function yearRangeError({ period, fromYear, toYear }) {
  if (period !== 'NAM') return '';
  if (fromYear > toYear) return 'Năm kết thúc phải bằng hoặc sau năm bắt đầu.';
  if (toYear - fromYear >= 20) return 'Chọn khoảng thời gian tối đa 20 năm.';
  return '';
}

export function revenueRows(data, today) {
  return data.cacKy.map((row, index, all) => ({
    ...row,
    short: data.ky === 'THANG' ? `T${Number(row.tuNgay.slice(5, 7))}` : row.nhan,
    fullLabel: data.ky === 'NAM' ? `Năm ${row.nhan}` : `${row.nhan}/${data.nam}`,
    future: row.tuNgay > today,
    partial: row.tuNgay <= today && row.denNgay >= today,
    growth: index === 0 || all[index - 1].doanhThu === 0 ? null
      : Math.round((row.doanhThu - all[index - 1].doanhThu) * 1000 / all[index - 1].doanhThu) / 10,
  }));
}

export function revenuePlans(rows) {
  const codes = [...new Set(['PRO', 'PREMIUM', ...rows.flatMap(row => Object.keys(row.theoGoi || {}))])];
  return codes.map(code => ({ code, name: code === 'PRO' ? 'Pro' : code === 'PREMIUM' ? 'Premium' : code,
    amount: rows.reduce((sum, row) => sum + planAmount(row, code), 0) }));
}

export function revenueCsv(data, rows) {
  const plans = revenuePlans(rows);
  const records = [
    ['Kỳ', 'Từ ngày', 'Đến ngày', ...plans.map(plan => `Doanh thu ${plan.name} (VND)`), 'Tổng doanh thu (VND)', 'Giao dịch thành công', 'So kỳ trước (%)', 'Ghi chú'],
    ...rows.map(row => [row.fullLabel, row.tuNgay, row.denNgay, ...plans.map(plan => planAmount(row, plan.code)),
      row.doanhThu, row.soGiaoDich, row.future ? '' : row.growth ?? '', row.future ? 'Chưa đến kỳ' : row.partial ? 'Đang diễn ra' : '']),
    ['Tổng cộng', '', '', ...plans.map(plan => plan.amount), data.tongDoanhThu, data.soGiaoDich, data.soVoiKyTruocPhanTram ?? '', 'Giờ Việt Nam'],
  ];
  const cell = value => `"${(typeof value === 'number' ? String(value) : String(value).replace(/^[=+@-]/, "'$&")).replace(/"/g, '""')}"`;
  return '\uFEFF' + records.map(row => row.map(cell).join(',')).join('\r\n');
}
