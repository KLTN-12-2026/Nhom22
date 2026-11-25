import { planKey } from './tier.mjs';

export const STREAM_URL = '/api/v1/events/stream';

export const REALTIME_KEYS = {
  THONG_BAO_MOI: () => [['notifications'], ['me'], ['support-tickets']],
  THONG_BAO_HE_THONG: () => [['announcements'], ['admin', 'announcements']],
  TAI_KHOAN_BI_KHOA: () => [],
  GOI_THAY_DOI: () => [['billing'], planKey, ['service-quota'], ['me'], ['themes']],
  THANH_TOAN: () => [['billing']],
  YEU_CAU_AI: id => [id ? ['ai-request', id] : ['ai-request'], ['ai-history'], ['service-quota']],
  HANG_CHO_QUAN_TRI: () => [['admin-queue'], ['admin-dashboard'], ['publish-requests'], ['admin-reports'], ['admin-support-tickets']],
  MUC_DA_XU_LY: () => [['admin-queue'], ['admin-dashboard'], ['publish-requests'], ['admin-reports'], ['admin-support-tickets']],
  SU_CO_HE_THONG: () => [['admin-dashboard'], ['admin-queue'], ['admin-service-usage']],
  PHIEN_HOC_MOI: () => [['learning-today']],
  BAO_CAO_MOI: () => [['admin-queue'], ['admin-dashboard'], ['admin-reports']],
  YEU_CAU_CONG_KHAI: id => [['publish-requests'], ['publish-request-cards'], ['my-decks'], id ? ['deck', id] : ['deck']],
};

export const REALTIME_EVENT = 'vl:realtime';

const COMPONENT = { CSDL: 'Cơ sở dữ liệu', REDIS: 'Redis' };

export function incidentMessage(id) {
  const [part, state] = String(id || '').split(':');
  if (part === 'TAC_VU') return { text: 'Có tác vụ nền vừa lỗi. Xem trang Dịch vụ.', bad: true };
  if (!COMPONENT[part]) return null;
  return state === 'UP'
    ? { text: `${COMPONENT[part]} đã hoạt động lại`, bad: false }
    : { text: `${COMPONENT[part]} không phản hồi`, bad: true };
}

export function handledId(id, kind) {
  const [type, value] = String(id || '').split(':');
  return type === kind && value ? value : null;
}

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
