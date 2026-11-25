export const CARD_SORTS = { MOI_NHAT: 'Mới nhất', CU_NHAT: 'Cũ nhất', TU_AZ: 'Từ A → Z', TU_ZA: 'Từ Z → A' };

export function parseCardSort(value) {
  return Object.hasOwn(CARD_SORTS, value) ? value : 'MOI_NHAT';
}

export function cardListParams({ page = 0, size = 20, search = '', sort = 'MOI_NHAT', focusId = null } = {}) {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  const text = search.trim();
  if (text) params.set('q', text);
  if (parseCardSort(sort) !== 'MOI_NHAT') params.set('sapXep', sort);
  if (focusId && !text && sort === 'MOI_NHAT') params.set('theId', String(focusId));
  return params.toString();
}
