// api-client.js
// GĐ0: fetch wrapper + CSRF + ApiError
// Xem chi tiết tại report/GD0_BAO_CAO_FE.md §6

export class ApiError extends Error {
  constructor(status, data) {
    super(data?.message || 'API Error');
    this.status = status;
    this.data = data;
  }
}

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function applyServerErrors(setError, errors) {
  if (!errors) return;
  Object.entries(errors).forEach(([field, message]) => {
    setError(field, { type: 'server', message });
  });
}
