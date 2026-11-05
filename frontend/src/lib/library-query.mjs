export function libraryQuery(params = {}) {
  const query = new URLSearchParams();
  for (const key of ['q', 'chuDeId', 'trinhDo', 'mucTieu', 'nguon', 'sort', 'page', 'size']) {
    const value = params[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, String(value).trim());
    }
  }
  return query.toString();
}

export function libraryPage(value) {
  const page = Number(value || 0);
  return Number.isSafeInteger(page) && page >= 0 && page <= 100000 ? page : 0;
}
