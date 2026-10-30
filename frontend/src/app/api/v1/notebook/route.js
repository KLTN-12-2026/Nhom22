import { NextResponse } from 'next/server';
import { proxyOrMock } from '@/app/api/v1/_mock/backend';
import { mockStore, visibleNotebook } from '@/app/api/v1/_mock/store';

const GROUPS = ['NGHIA', 'CHINH_TA', 'NGHE', 'NGU_CANH', 'CAP_NHAM'];

function list(req) {
  const params = req.nextUrl.searchParams;
  const page = Math.max(0, Number.parseInt(params.get('page') || '0', 10) || 0);
  const size = Math.min(100, Math.max(1, Number.parseInt(params.get('size') || '20', 10) || 20));
  const nhomLoi = params.get('nhomLoi') || '';
  const all = visibleNotebook(mockStore(req));
  const inGroup = (item, group) => {
    if (group === 'QUEN_NHIEU') return item.soLanQuen >= 3;
    if (group === 'DANH_DAU') return item.danhDauThuCong;
    return (item.nhomLoi || []).some(g => g.nhomLoi === group);
  };
  const tongHop = { TAT_CA: all.length };
  [...GROUPS, 'QUEN_NHIEU', 'DANH_DAU'].forEach(group => { tongHop[group] = all.filter(item => inGroup(item, group)).length; });
  const filtered = nhomLoi ? all.filter(item => inGroup(item, nhomLoi)) : all;
  return NextResponse.json({
    tongHop,
    items: filtered.slice(page * size, (page + 1) * size),
    page,
    size,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size)
  });
}

export async function GET(req) {
  return proxyOrMock(req, '/api/v1/notebook', () => list(req));
}
