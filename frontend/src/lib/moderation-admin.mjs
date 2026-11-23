export const REPORT_KINDS = { BO_THE: 'Bộ thẻ', THE_TU_VUNG: 'Thẻ từ vựng', YEU_CAU_AI: 'Đầu ra AI' };
export const REPORT_REASONS = { SAI_NOI_DUNG: 'Nghĩa hoặc giải thích sai', KHONG_PHU_HOP: 'Nội dung không phù hợp', KHAC: 'Lý do khác' };
export const REPORT_STATES = {
  CHO_XU_LY: { label: 'Chờ xử lý', style: 'stamp-warning' },
  DA_GIU: { label: 'Đã giữ', style: 'stamp-quiet' },
  DA_AN: { label: 'Đã ẩn', style: 'stamp-danger' },
};
export const SNAPSHOT_LABELS = {
  moTa: 'Mô tả', boMau: 'Bộ mẫu', tu: 'Từ', tuLoai: 'Từ loại', nghiaVi: 'Nghĩa tiếng Việt', phienAm: 'Phiên âm',
  viDuEn: 'Ví dụ tiếng Anh', dichVi: 'Dịch ví dụ', loai: 'Loại AI', inputRef: 'Đầu vào', nhaCungCap: 'Nhà cung cấp',
  model: 'Model', phienBanPrompt: 'Phiên bản prompt', ketQua: 'Kết quả', banNhap: 'Thẻ nháp', ten: 'Tên',
  giaiThich: 'Giải thích', doanLienQuan: 'Đoạn liên quan', meoNho: 'Mẹo nhớ', cauGoc: 'Câu gốc', cauSua: 'Câu sửa',
  nhanXet: 'Nhận xét', dungTuMucTieu: 'Đã dùng từ mục tiêu', cachDungTu: 'Cách dùng từ', loi: 'Lỗi',
  doanGoc: 'Đoạn gốc', doanSua: 'Đoạn sửa', nguon: 'Nguồn', tuMucTieu: 'Từ mục tiêu',
  tenHienThi: 'Tên hiển thị', thamGiaAt: 'Tham gia',
};

export function reportQuery({ trangThai = '', loaiDoiTuong = '', page = 0, size = 20 } = {}) {
  const query = new URLSearchParams();
  if (trangThai) query.set('trangThai', trangThai);
  if (loaiDoiTuong) query.set('loaiDoiTuong', loaiDoiTuong);
  query.set('page', String(page));
  query.set('size', String(size));
  return query.toString();
}

export function resolutionPayload(quyetDinh, reason) {
  if (!['GIU', 'AN'].includes(quyetDinh)) throw Object.assign(new Error('Chọn giữ hoặc ẩn nội dung.'), { field: 'quyetDinh' });
  const lyDo = String(reason || '').trim();
  if (lyDo.length < 10 || lyDo.length > 500) throw Object.assign(new Error('Nhập lý do từ 10 đến 500 ký tự.'), { field: 'lyDo' });
  return { quyetDinh, lyDo };
}

export function snapshotEntries(snapshot = {}) {
  return Object.entries(snapshot || {})
    .filter(([key, value]) => !['ten', 'chuSoHuuId', 'boTheId', 'anhDaiDienId'].includes(key) && value != null)
    .map(([key, value]) => (key === 'thamGiaAt' ? [key, new Date(value).toLocaleDateString('vi-VN')] : [key, value]));
}

export function reportTitle(report) {
  return report.noiDung?.ten || `${REPORT_KINDS[report.loaiDoiTuong] || 'Nội dung'} #${report.doiTuongId}`;
}
