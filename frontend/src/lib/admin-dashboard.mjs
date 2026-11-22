export const RANGES = [7, 30, 90];

export const SERVICE_LABEL = { AI: 'Trợ lý AI', ANH: 'Ảnh thẻ AI', TTS: 'Đọc phát âm', PHAT_AM: 'Chấm phát âm' };

export const USER_STATUS = {
  HOAT_DONG: ['Hoạt động', 'ok'],
  CHUA_XAC_THUC: ['Chưa xác thực', 'warn'],
  BI_KHOA: ['Bị khóa', 'bad'],
  DANG_XOA: ['Đang xóa', 'mute'],
};

export const ACTION_LABEL = {
  KHOA_TAI_KHOAN: 'khóa tài khoản', MO_KHOA_TAI_KHOAN: 'mở khóa tài khoản',
  CAP_QUYEN_QUAN_TRI: 'cấp quyền quản trị cho', THU_QUYEN_QUAN_TRI: 'thu quyền quản trị của',
  TAO_BO_MAU: 'tạo bộ mẫu', SUA_BO_MAU: 'sửa bộ mẫu', XUAT_BAN_BO_MAU: 'xuất bản bộ mẫu',
  CHUYEN_VE_NHAP: 'chuyển về nháp bộ', AN_BO_MAU: 'ẩn bộ mẫu', HIEN_BO_MAU: 'hiện lại bộ mẫu', XOA_BO_MAU: 'xóa bộ mẫu',
  TAO_THE_MAU: 'thêm thẻ mẫu', SUA_THE_MAU: 'sửa thẻ mẫu', XOA_THE_MAU: 'xóa thẻ mẫu',
  SUA_GOI_DICH_VU: 'sửa gói dịch vụ', SUA_HAN_GOI: 'sửa hạn gói', CHAY_KIEM_TRA_HET_HAN: 'chạy kiểm tra hết hạn',
  XOA_TAI_KHOAN: 'xóa tài khoản', GIU_NOI_DUNG: 'giữ nội dung bị báo cáo', AN_NOI_DUNG: 'ẩn nội dung bị báo cáo',
  SUA_HAN_MUC: 'sửa hạn mức', TAO_THONG_BAO: 'tạo thông báo', SUA_THONG_BAO: 'sửa thông báo', XOA_THONG_BAO: 'xóa thông báo',
  DUYET_CONG_KHAI: 'duyệt công khai', TU_CHOI_CONG_KHAI: 'từ chối công khai', THU_HOI_CONG_KHAI: 'thu hồi công khai',
  TAO_HUY_HIEU: 'tạo huy hiệu', SUA_HUY_HIEU: 'sửa huy hiệu',
  TAO_THU_THACH: 'tạo thử thách', SUA_THU_THACH: 'sửa thử thách',
};

export const ACTION_TONE = {
  KHOA_TAI_KHOAN: 'bad', XOA_TAI_KHOAN: 'bad', XOA_BO_MAU: 'bad', XOA_THE_MAU: 'bad', AN_NOI_DUNG: 'bad', THU_HOI_CONG_KHAI: 'bad', TU_CHOI_CONG_KHAI: 'bad',
  AN_BO_MAU: 'warn', SUA_HAN_MUC: 'warn', SUA_HAN_GOI: 'warn', SUA_GOI_DICH_VU: 'warn',
  MO_KHOA_TAI_KHOAN: 'ok', XUAT_BAN_BO_MAU: 'ok', DUYET_CONG_KHAI: 'ok', GIU_NOI_DUNG: 'ok',
};

const nf = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 1 });

export const num = value => nf.format(value ?? 0);

export function compactMoney(value) {
  const v = value ?? 0;
  if (Math.abs(v) >= 1e9) return `${nf.format(v / 1e9)} tỷ`;
  if (Math.abs(v) >= 1e6) return `${nf.format(v / 1e6)} tr`;
  return `${nf.format(v)} đ`;
}

export function actionLabel(code) {
  return ACTION_LABEL[code] || String(code || '').toLowerCase().replaceAll('_', ' ');
}

export function delta(current, previous) {
  if (previous == null || previous === 0) return current > 0 ? { text: 'kỳ trước bằng 0', tone: 'flat', noBase: true } : null;
  const pct = Math.round(((current - previous) / previous) * 1000) / 10;
  if (pct === 0) return { text: '0%', tone: 'flat' };
  return { text: `${pct > 0 ? '+' : ''}${nf.format(pct)}%`, tone: pct > 0 ? 'up' : 'down' };
}

export function scaleMax(max) {
  if (!max || max <= 0) return 4;
  const raw = max / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(n => n * power).find(n => n >= raw);
  return step * 4;
}

export function linePoints(values, { width, height, left = 0, top = 0, max }) {
  const ceiling = max ?? scaleMax(Math.max(...values, 0));
  const span = Math.max(1, values.length - 1);
  return values.map((value, index) => [
    left + (index / span) * width,
    top + height - (value / ceiling) * height,
  ]);
}

export function sparkPath(values, width = 84, height = 28) {
  if (!values.length) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, values.length - 1);
  return values.map((value, index) => {
    const x = (index / span) * width;
    const y = height - 2 - ((value - min) / (max - min || 1)) * (height - 4);
    return `${index ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

export function relativeTime(iso, now = Date.now()) {
  if (!iso) return '';
  const seconds = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (seconds < 60) return 'vừa xong';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

export function shortDay(isoDate) {
  const [, m, d] = String(isoDate).split('-');
  return `${d}/${m}`;
}

export function planShare(data) {
  const paid = data.coCauGoi.map(plan => ({ code: plan.goiMa, name: plan.ten, count: plan.soNguoi }));
  const free = Math.max(0, data.chiSo.dangHoatDong - data.chiSo.thueBaoHieuLuc);
  const rows = [{ code: 'FREE', name: 'Miễn phí', count: free }, ...paid];
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const paidCount = paid.reduce((sum, row) => sum + row.count, 0);
  return { rows, total, paidPct: total ? Math.round((paidCount / total) * 1000) / 10 : 0 };
}

export function queueItems(queue) {
  return [
    { key: 'publish', label: 'Yêu cầu công khai bản sao', count: queue.congKhaiChoDuyet, icon: 'check', tone: 'acc', href: '/quan-tri/duyet-cong-khai', overdue: queue.congKhaiCuNhatAt && Date.now() - Date.parse(queue.congKhaiCuNhatAt) > 48 * 3600e3 },
    { key: 'reports', label: 'Báo cáo nội dung chờ xử lý', count: queue.baoCaoChoXuLy, icon: 'alert', tone: 'bad', href: '/quan-tri/bao-cao' },
    { key: 'expiring', label: 'Thuê bao hết hạn trong 7 ngày', count: queue.thueBaoSapHetHan, icon: 'clock', tone: 'warn', href: '/quan-tri/thanh-toan' },
    { key: 'pending-pay', label: 'Giao dịch chờ quá 15 phút', count: queue.giaoDichTreo, icon: 'file', tone: 'bad', href: '/quan-tri/thanh-toan' },
    { key: 'unverified', label: 'Chưa xác thực email quá 48 giờ', count: queue.chuaXacThucQua48h, icon: 'mail', tone: 'info', href: '/quan-tri/tai-khoan?trangThai=CHUA_XAC_THUC' },
    { key: 'jobs', label: 'Tác vụ nền lỗi trong 24 giờ', count: queue.tacVuLoi24h, icon: 'refresh', tone: 'bad' },
  ];
}
