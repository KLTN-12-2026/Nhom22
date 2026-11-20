export const PLAN_STATUS = {
  HIEU_LUC: ['Hiệu lực', 'ok'],
  HET_HAN: ['Hết hạn', 'mute'],
  DA_HUY: ['Đã hủy', 'warn'],
};

export const PAYMENT_STATUS = {
  THANH_CONG: ['Thành công', 'ok'],
  CHO_THANH_TOAN: ['Chờ thanh toán', 'warn'],
  THAT_BAI: ['Thất bại', 'bad'],
  HET_HAN: ['Hết hạn', 'mute'],
};

export const CYCLE = { THANG: 'tháng', NAM: 'năm' };

export const DETAIL_TABS = [
  { value: 'tong-quan', label: 'Tổng quan' },
  { value: 'hoc-tap', label: 'Học tập' },
  { value: 'thanh-toan', label: 'Thanh toán' },
  { value: 'nhat-ky', label: 'Nhật ký' },
];

const DAY = 86_400_000;
const money = new Intl.NumberFormat('vi-VN');

export const userDetailUrl = id => `/api/v1/admin/users/${encodeURIComponent(id)}`;

export function userAuditUrl(id, page = 0, size = 10) {
  const params = new URLSearchParams({ loai: 'NGUOI_DUNG', doiTuongId: String(id), page: String(page), size: String(size) });
  return `/api/v1/admin/audit-logs?${params}`;
}

export const formatMoney = value => `${money.format(value ?? 0)} ₫`;

export function initials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return words.slice(-2).map(word => word[0]).join('').toUpperCase();
}

export function daysLeft(iso, now = Date.now()) {
  if (!iso) return null;
  return Math.ceil((Date.parse(iso) - now) / DAY);
}

export function daysSince(isoDate, now = Date.now()) {
  if (!isoDate) return null;
  const [y, m, d] = isoDate.split('-').map(Number);
  const today = new Date(now);
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((start - Date.UTC(y, m - 1, d)) / DAY);
}

export function heatLevel(value, max) {
  if (!value || !max) return 0;
  return Math.min(4, Math.max(1, Math.ceil((value / max) * 4)));
}

export function learningMax(days = []) {
  return days.reduce((max, day) => Math.max(max, day.luotOn || 0), 0);
}

export function attentionFlags(detail, now = Date.now()) {
  if (!detail) return [];
  const flags = [];
  const user = detail.nguoiDung || {};
  if (user.trangThai === 'BI_KHOA') flags.push({ tone: 'bad', text: 'Tài khoản đang bị khóa' });
  if (user.trangThai === 'CHUA_XAC_THUC') flags.push({ tone: 'warn', text: 'Chưa xác thực email' });
  if (user.trangThai === 'DANG_XOA') flags.push({ tone: 'mute', text: 'Đang trong quá trình xóa dữ liệu' });
  const pending = detail.baoCao?.biBaoCaoChoXuLy || 0;
  if (pending) flags.push({ tone: 'bad', text: `${pending} báo cáo về nội dung của người này đang chờ xử lý`, href: '/quan-tri/bao-cao' });
  const plan = detail.goiHienTai;
  const left = plan ? daysLeft(plan.hetHanAt, now) : null;
  if (plan && left !== null && left <= 7 && !plan.huyAt) flags.push({ tone: 'warn', text: `Gói ${plan.tenGoi || plan.goiMa} hết hạn sau ${Math.max(left, 0)} ngày` });
  const failed = detail.thanhToan?.soThatBai || 0;
  if (failed) flags.push({ tone: 'warn', text: `${failed} giao dịch thất bại` });
  const idle = daysSince(detail.hocTap?.hocCuoiNgay, now);
  if (user.trangThai === 'HOAT_DONG' && (idle === null || idle >= 14)) {
    flags.push({ tone: 'mute', text: idle === null ? 'Chưa học buổi nào' : `Không học ${idle} ngày` });
  }
  return flags;
}
