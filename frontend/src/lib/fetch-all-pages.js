import { apiFetch } from '@/lib/api-client';

export async function fetchAllPages(path, size = 100) {
  const join = path.includes('?') ? '&' : '?';
  const first = await apiFetch(`${path}${join}size=${size}`);
  const items = [...first.items];
  for (let page = 1; page < first.totalPages; page++) {
    items.push(...(await apiFetch(`${path}${join}size=${size}&page=${page}`)).items);
  }
  return items;
}
