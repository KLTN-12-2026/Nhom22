import { planKey } from './tier.mjs';

export const STREAM_URL = '/api/v1/events/stream';

export const REALTIME_KEYS = {
  THONG_BAO_MOI: () => [['notifications']],
  THONG_BAO_HE_THONG: () => [['announcements'], ['admin', 'announcements']],
  TAI_KHOAN_BI_KHOA: () => [],
  GOI_THAY_DOI: () => [['billing'], planKey, ['service-quota'], ['me']],
  THANH_TOAN: () => [['billing']],
  YEU_CAU_AI: id => [id ? ['ai-request', id] : ['ai-request'], ['ai-history'], ['service-quota']],
  HANG_CHO_QUAN_TRI: () => [['admin-queue'], ['admin-dashboard'], ['publish-requests'], ['admin-reports']],
};

export function parseEvent(raw) {
  try {
    const data = JSON.parse(raw);
    return { loai: String(data.loai || ''), id: data.id ? String(data.id) : null };
  } catch {
    return { loai: '', id: null };
  }
}

export function keysFor(type, id) {
  const build = REALTIME_KEYS[type];
  return build ? build(id) : [];
}
