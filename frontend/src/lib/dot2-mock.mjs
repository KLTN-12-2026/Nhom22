const DOT2_ROUTES = ['/luyen-tap', '/luyen-tap-lam-bai', '/luyen-tap-ket-qua', '/luyen-tap-lich-su', '/so-tay', '/thong-ke'];
const FALLBACK_STATUS = [404, 405, 501, 502, 503];
export const NO_ROUTE_MESSAGE = 'Không tìm thấy đường dẫn';

export function dot2MockEnabled(flag = process.env.NEXT_PUBLIC_DOT2_MOCK, nodeEnv = process.env.NODE_ENV) {
  if (flag === 'enabled') return true;
  if (flag === 'disabled') return false;
  return nodeEnv === 'development';
}

export function isDot2Route(path) {
  return DOT2_ROUTES.some(route => path === route || path.startsWith(route + '/'));
}

export function shouldUseMock(status, body) {
  if (status === 404) return !body?.code || body.message === NO_ROUTE_MESSAGE;
  return FALLBACK_STATUS.includes(status);
}
