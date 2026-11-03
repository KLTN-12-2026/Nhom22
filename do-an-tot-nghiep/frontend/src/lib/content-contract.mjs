import { z } from 'zod';

export const cardSchema = z.object({
  tu: z.string().trim().min(1, 'Nhập từ hoặc cụm từ').max(100, 'Từ tối đa 100 ký tự'),
  tuLoai: z.string().trim().max(30),
  nghiaVi: z.string().trim().min(1, 'Nhập nghĩa tiếng Việt').max(500, 'Nghĩa tối đa 500 ký tự'),
  phienAm: z.string().max(100),
  viDuEn: z.string().max(300),
  dichVi: z.string().max(300),
  doKho: z.coerce.number().int().min(1).max(5),
  nguon: z.string().max(500),
  nhanIds: z.array(z.string().regex(/^[1-9][0-9]*$/)).max(100),
});

export function cardPayload(values, initial) {
  const body = cardSchema.parse(values);
  for (const [field, flag] of [['anhId', 'boAnh'], ['amTuId', 'boAmTu'], ['amCauId', 'boAmCau']]) {
    if (values[field]) body[field] = values[field];
    else if (initial?.[field]) body[flag] = true;
  }
  if (initial) body.version = initial.version;
  return body;
}

export function normalizeTerm(value) {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ').toLowerCase();
}

export function safeNext(value, fallback = '/bo-the') {
  return value && value.length <= 200 && value.startsWith('/') && !value.startsWith('//') && !/[\\\r\n]/u.test(value) ? value : fallback;
}
