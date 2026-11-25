export const PUBLISH_STATUS = {
  CHO_DUYET: 'Chờ duyệt',
  DA_DUYET: 'Đã duyệt',
  TU_CHOI: 'Bị từ chối',
  HET_HAN: 'Hết hạn',
  DA_RUT: 'Đã rút',
  THU_HOI: 'Đã thu hồi',
};

export const PUBLISH_STAMP = {
  CHO_DUYET: 'stamp-warning',
  DA_DUYET: 'stamp-success',
  TU_CHOI: 'stamp-danger',
  HET_HAN: 'stamp-quiet',
  DA_RUT: 'stamp-quiet',
  THU_HOI: 'stamp-danger',
};

export const APPROVER = { TAC_GIA: 'Tác giả bộ gốc', ADMIN: 'Quản trị viên' };

export const PUBLISH_REASON = {
  KHONG_PHAI_BAN_SAO: 'Bộ này không phải bản sao, bạn có thể đổi quyền truy cập trực tiếp.',
  DA_CONG_KHAI: 'Bản sao đã được công khai.',
  DA_AN: 'Bản sao đang bị ẩn do kiểm duyệt nên chưa gửi được.',
  CHO_GUI_LAI: 'Bạn cần chờ 24 giờ sau lần bị từ chối hoặc thu hồi.',
  CAN_DUYET_CONG_KHAI: 'Bản sao chỉ được công khai khi tác giả bộ gốc duyệt.',
  BAN_SAO_KHONG_HOP_LE: 'Bản sao đã bị xóa hoặc đang bị ẩn.',
  KHONG_CO_THAY_DOI: 'Bản sao chưa khác bộ gốc. Hãy sửa tên, mô tả hoặc thêm, sửa thẻ rồi xin công khai.',
};

export const reasonOf = error => error?.data?.details?.lyDo;

export const formatTime = iso => (iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export function canResubmit(status, now = Date.now()) {
  if (!status) return true;
  if (status.trangThai === 'CHO_DUYET') return false;
  return !status.guiLaiSauAt || Date.parse(status.guiLaiSauAt) <= now;
}

export function submitPublishRequest(apiFetch, deckId, loiNhan) {
  return apiFetch(`/api/v1/decks/${encodeURIComponent(deckId)}/publish-requests`, {
    method: 'POST',
    body: JSON.stringify({ loiNhan: loiNhan?.trim() || null }),
  });
}

export function withdrawPublishRequest(apiFetch, requestId) {
  return apiFetch(`/api/v1/publish-requests/${encodeURIComponent(requestId)}`, { method: 'DELETE' });
}

export function listPublishRequests(apiFetch, { admin = false, trangThai = '', page = 0, size = 20 } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (trangThai) params.set('trangThai', trangThai);
  return apiFetch(`/api/v1/${admin ? 'admin' : 'me'}/publish-requests?${params}`);
}

export function decidePublishRequest(apiFetch, requestId, { quyetDinh, lyDo, version }, admin = false) {
  const base = admin ? '/api/v1/admin/publish-requests' : '/api/v1/publish-requests';
  return apiFetch(`${base}/${encodeURIComponent(requestId)}/decision`, {
    method: 'POST',
    body: JSON.stringify({ quyetDinh, lyDo: lyDo?.trim() || null, version }),
  });
}
