export const BADGE_CONDITIONS = {
  TONG_LUOT_ON: 'Tổng lượt ôn hợp lệ',
  CHUOI_NGAY: 'Chuỗi ngày học hợp lệ',
  TONG_BAI_LUYEN: 'Tổng bài luyện đã nộp',
  TONG_DIEM: 'Tổng điểm thưởng',
  XEP_HANG_TUAN: 'Thứ hạng bảng xếp hạng tuần',
};

export const newMotivation = kind => ({
  ma: '', ten: '', moTa: '', hoatDong: true,
  ...(kind === 'badges' ? { loaiDieuKien: 'TONG_LUOT_ON', nguong: 1, thuTu: 0 }
    : { loaiDieuKien: 'LUOT_ON', chuKy: 'TUAN', mucTieu: 40 }),
});

export function motivationPayload(kind, draft, original) {
  const common = {
    ma: original?.ma ?? draft.ma.trim(), ten: draft.ten.trim(), moTa: draft.moTa.trim(),
    hoatDong: draft.hoatDong,
    ...(original ? { version: original.version } : {}),
  };
  return kind === 'badges'
    ? { ...common, loaiDieuKien: draft.loaiDieuKien, nguong: Number(draft.nguong), thuTu: Number(draft.thuTu) }
    : { ...common, loaiDieuKien: 'LUOT_ON', chuKy: 'TUAN', mucTieu: Number(draft.mucTieu) };
}

export function motivationErrors(kind, draft) {
  const errors = {};
  if (!/^[A-Z][A-Z0-9_]{0,29}$/.test(draft.ma.trim())) errors.ma = 'Nhập 1–30 ký tự viết hoa, số hoặc dấu gạch dưới; bắt đầu bằng chữ.';
  if (!draft.ten.trim() || draft.ten.trim().length > 100) errors.ten = 'Nhập tên từ 1 đến 100 ký tự.';
  if (!draft.moTa.trim() || draft.moTa.trim().length > 255) errors.moTa = 'Nhập mô tả từ 1 đến 255 ký tự.';
  const target = kind === 'badges' ? 'nguong' : 'mucTieu';
  if (!/^\d+$/.test(String(draft[target])) || Number(draft[target]) < 1 || Number(draft[target]) > 2147483647) errors[target] = 'Nhập số nguyên dương, tối đa 2.147.483.647.';
  if (kind === 'badges') {
    if (!BADGE_CONDITIONS[draft.loaiDieuKien]) errors.loaiDieuKien = 'Chọn điều kiện nhận huy hiệu.';
    if (!/^\d+$/.test(String(draft.thuTu)) || Number(draft.thuTu) > 2147483647) errors.thuTu = 'Nhập số nguyên không âm, tối đa 2.147.483.647.';
  }
  return errors;
}

export function motivationCondition(kind, item) {
  const value = new Intl.NumberFormat('vi-VN').format(kind === 'badges' ? item.nguong : item.mucTieu);
  if (kind === 'challenges') return `${value} lượt ôn hợp lệ / tuần`;
  return ({
    TONG_LUOT_ON: `${value} lượt ôn hợp lệ`, CHUOI_NGAY: `Chuỗi ${value} ngày học hợp lệ`,
    TONG_BAI_LUYEN: `${value} bài luyện đã nộp`, TONG_DIEM: `${value} điểm thưởng`,
    XEP_HANG_TUAN: item.nguong === 1 ? 'Hạng nhất bảng xếp hạng tuần' : `Top ${value} bảng xếp hạng tuần`,
  })[item.loaiDieuKien] || 'Điều kiện chưa được hỗ trợ';
}
