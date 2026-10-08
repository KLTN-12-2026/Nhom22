export class ApiError extends Error {
  constructor(status, data = {}) {
    const fields = Array.isArray(data.fieldErrors) ? data.fieldErrors.map(e => e.message).join('; ') : '';
    super([data.message || (!fields && 'Không thể kết nối. Vui lòng thử lại.'), fields, (data.requestId || data.traceId) && `Mã lỗi: ${data.requestId || data.traceId}`].filter(Boolean).join(' '));
    this.status = status;
    this.data = data;
    this.fieldErrors = data.fieldErrors || [];
    this.traceId = data.requestId || data.traceId;
  }
}
let csrfPromise;
export function resetCsrf() { csrfPromise = undefined; }
async function csrf() {
  if (!csrfPromise) {
    csrfPromise = fetch('/api/v1/auth/csrf', { credentials: 'include', cache: 'no-store' })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new ApiError(res.status, data);
        return data;
      }).catch(error => { resetCsrf(); throw error; });
  }
  return csrfPromise;
}
export async function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await csrf();
    headers.set(token.headerName, token.token);
  }
  let res;
  try { res = await fetch(path, { ...options, method, credentials: 'include', headers }); }
  catch { throw new ApiError(0); }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 403) resetCsrf();
    throw new ApiError(res.status, data);
  }
  if (['/api/v1/auth/login', '/api/v1/auth/logout'].includes(path)) resetCsrf();
  if (res.status === 204) return null;
  const body = await res.text();
  return body ? JSON.parse(body) : null;
}
export function applyServerErrors(setError, errors) {
  const fields = Array.isArray(errors) ? errors : Object.entries(errors || {}).map(([field, message]) => ({ field, message }));
  fields.forEach(({ field, message }) => setError(field, { type: 'server', message }));
}
export async function logout(queryClient) {
  await apiFetch('/api/v1/auth/logout', { method: 'POST' });
  queryClient.clear();
  window.location.assign('/dang-nhap?loggedOut=1');
}
