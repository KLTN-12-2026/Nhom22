export const REPORT_TABS = [
  { value: 'CHO_XU_LY', label: 'Chờ xử lý' },
  { value: 'DA_GIU', label: 'Đã giữ' },
  { value: 'DA_AN', label: 'Đã ẩn' },
  { value: '', label: 'Tất cả' },
];

export const REPORT_STATUS = {
  CHO_XU_LY: ['Chờ xử lý', 'warn'],
  DA_GIU: ['Đã giữ', 'ok'],
  DA_AN: ['Đã ẩn', 'bad'],
};

export const TARGET_TYPE = { BO_THE: 'Bộ thẻ', THE_TU_VUNG: 'Thẻ', YEU_CAU_AI: 'Đầu ra AI' };

export const REPORT_REASON = { SAI_NOI_DUNG: 'Sai nội dung', KHONG_PHU_HOP: 'Không phù hợp', KHAC: 'Lý do khác' };

export const SERVICE_TYPES = ['AI', 'ANH', 'TTS', 'PHAT_AM'];

export const SERVICE_INFO = {
  AI: ['Trợ lý AI', 'Giải thích ngữ cảnh, sửa câu, xưởng thẻ'],
  ANH: ['Ảnh thẻ AI', 'Tạo ảnh minh họa cho thẻ'],
  TTS: ['Đọc phát âm', 'Âm thanh đọc từ và câu ví dụ'],
  PHAT_AM: ['Chấm phát âm', 'Đánh giá giọng đọc của người học'],
};

export const REASON_MIN = 10;
export const REASON_MAX = 500;
export const QUOTA_MAX = 10000;

const SNAPSHOT_FIELDS = {
  BO_THE: [['moTa', 'Mô tả'], ['boMau', 'Bộ mẫu']],
  THE_TU_VUNG: [['tu', 'Từ'], ['tuLoai', 'Từ loại'], ['phienAm', 'Phiên âm'], ['nghiaVi', 'Nghĩa'], ['viDuEn', 'Ví dụ'], ['dichVi', 'Dịch ví dụ']],
  YEU_CAU_AI: [['loai', 'Loại yêu cầu'], ['inputRef', 'Đầu vào'], ['nhaCungCap', 'Nhà cung cấp'], ['model', 'Model'], ['phienBanPrompt', 'Phiên bản prompt'], ['ketQua', 'Kết quả'], ['banNhap', 'Bản nháp']],
};

export function reportsUrl({ trangThai = '', loaiDoiTuong = '', page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (trangThai) params.set('trangThai', trangThai);
  if (loaiDoiTuong) params.set('loaiDoiTuong', loaiDoiTuong);
  return `/api/v1/admin/reports?${params}`;
}

export function listReports(apiFetch, query) {
  return apiFetch(reportsUrl(query));
}

export function resolveReport(apiFetch, id, { quyetDinh, lyDo }) {
  return apiFetch(`/api/v1/admin/reports/${encodeURIComponent(id)}/resolve`, {
    method: 'POST',
    body: JSON.stringify({ quyetDinh, lyDo: lyDo.trim() }),
  });
}

export function reasonError(text) {
  const length = (text || '').trim().length;
  if (length < REASON_MIN) return `Nhập lý do ít nhất ${REASON_MIN} ký tự (còn thiếu ${REASON_MIN - length}).`;
  if (length > REASON_MAX) return `Lý do tối đa ${REASON_MAX} ký tự.`;
  return '';
}

function display(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (Array.isArray(value)) return value.length ? value.map(item => (typeof item === 'object' ? (item.tu || item.ten || JSON.stringify(item)) : String(item))).join(', ') : null;
  if (typeof value === 'object') return Object.entries(value).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n');
  return String(value);
}

export function snapshotRows(report) {
  const fields = SNAPSHOT_FIELDS[report?.loaiDoiTuong] || [];
  const content = report?.noiDung || {};
  return fields.map(([key, label]) => [label, display(content[key])]).filter(([, value]) => value != null);
}

export function contentLink(report) {
  const content = report?.noiDung || {};
  if (report?.loaiDoiTuong === 'BO_THE') return content.boMau ? `/quan-tri/bo-mau?id=${report.doiTuongId}` : `/thu-vien/${report.doiTuongId}`;
  if (report?.loaiDoiTuong === 'THE_TU_VUNG' && content.boTheId) return `/thu-vien/${content.boTheId}?the=${report.doiTuongId}`;
  return null;
}

export function usageUrl({ tuNgay, denNgay } = {}) {
  const params = new URLSearchParams();
  if (tuNgay) params.set('tuNgay', tuNgay);
  if (denNgay) params.set('denNgay', denNgay);
  const query = params.toString();
  return `/api/v1/admin/service-usage${query ? `?${query}` : ''}`;
}

export function rangeDates(days, today) {
  const end = new Date(`${today}T00:00:00Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { tuNgay: start.toISOString().slice(0, 10), denNgay: today };
}

export function quotaKey(item) {
  return `${item.goiMa}:${item.loai}`;
}

export function quotaPlans(items) {
  const order = ['PRO', 'PREMIUM'];
  return [...new Set(items.map(item => item.goiMa))].sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
  });
}

export function quotaChanges(items, draft) {
  return items
    .filter(item => draft[quotaKey(item)] !== undefined && Number(draft[quotaKey(item)]) !== item.soLuotNgay)
    .map(item => ({ goiMa: item.goiMa, loai: item.loai, soLuotNgay: Number(draft[quotaKey(item)]), version: item.version, truoc: item.soLuotNgay }));
}

export function quotaInputError(value) {
  if (value === '' || value == null) return 'Nhập số lượt';
  const n = Number(value);
  if (!Number.isInteger(n)) return 'Phải là số nguyên';
  if (n < 0 || n > QUOTA_MAX) return `Từ 0 đến ${QUOTA_MAX.toLocaleString('vi-VN')}`;
  return '';
}

export function updateQuotas(apiFetch, changes, lyDo) {
  return apiFetch('/api/v1/admin/service-quotas', {
    method: 'PUT',
    body: JSON.stringify({
      hanMuc: changes.map(({ goiMa, loai, soLuotNgay, version }) => ({ goiMa, loai, soLuotNgay, version })),
      lyDo: lyDo.trim(),
    }),
  });
}

export function errorRate(service) {
  if (service.soLoi == null) return null;
  const failed = (service.soLoi || 0) + (service.soKhongXacDinh || 0);
  const total = service.soLuotDung + failed;
  return total ? Math.round((failed / total) * 1000) / 10 : 0;
}
