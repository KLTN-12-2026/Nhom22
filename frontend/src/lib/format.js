// format.js
// Tiện ích định dạng ngày giờ (theo múi giờ người học), số liệu

/**
 * Định dạng ngày giờ theo múi giờ của người dùng
 * @param {string|Date} date
 * @param {string} [timeZone] - mặc định dùng múi giờ trình duyệt
 */
export function formatDate(date, timeZone) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(date));
}

/**
 * Định dạng ngày giờ đầy đủ
 */
export function formatDateTime(date, timeZone) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(new Date(date));
}

/**
 * Định dạng số (ví dụ: 1234 -> 1.234)
 */
export function formatNumber(num) {
  return new Intl.NumberFormat('vi-VN').format(num);
}

/**
 * Định dạng phần trăm (ví dụ: 0.85 -> 85%)
 */
export function formatPercent(ratio) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(ratio);
}

/**
 * Tính thời gian tương đối (ví dụ: "3 ngày trước")
 */
export function formatRelative(date) {
  const diff = Date.now() - new Date(date).getTime();
  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });
  const days = Math.round(diff / (1000 * 60 * 60 * 24));
  if (Math.abs(days) < 1) return 'Hôm nay';
  return rtf.format(-days, 'day');
}
