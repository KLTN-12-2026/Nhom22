export const PRACTICE_TYPE = {
  CHON_NGHIA: 'Chọn nghĩa',
  CHON_TU: 'Chọn từ',
  GHEP_TU: 'Ghép từ với nghĩa',
  DIEN_CHO_TRONG: 'Điền chỗ trống',
  NHAP_TU_THEO_NGHIA: 'Nhập từ theo nghĩa',
  NGHE_VIET: 'Nghe và viết',
  PHAN_BIET_CAP: 'Phân biệt cặp dễ nhầm',
  TONG_HOP: 'Kiểm tra tổng hợp'
};

export const ERROR_GROUP = {
  NGHIA: 'Nghĩa',
  CHINH_TA: 'Chính tả',
  NGHE: 'Nghe',
  NGU_CANH: 'Dùng từ trong câu',
  CAP_NHAM: 'Cặp dễ nhầm',
  PHAT_AM: 'Phát âm'
};

export const SKILL = {
  NHAN_NGHIA: 'Nhận nghĩa',
  VIET: 'Viết đúng chính tả',
  NGHE: 'Nghe và viết',
  NGU_CANH: 'Dùng từ trong câu',
  CAP_NHAM: 'Phân biệt cặp dễ nhầm'
};

export const SKILL_PRACTICE = {
  NHAN_NGHIA: 'CHON_NGHIA',
  VIET: 'NHAP_TU_THEO_NGHIA',
  NGHE: 'NGHE_VIET',
  NGU_CANH: 'DIEN_CHO_TRONG',
  CAP_NHAM: 'PHAN_BIET_CAP'
};

export const label = (map, code) => map[code] || code;

export function splitBlank(sentence) {
  const index = (sentence || '').indexOf('_____');
  if (index < 0) return [sentence || '', null];
  return [sentence.slice(0, index), sentence.slice(index + 5)];
}
