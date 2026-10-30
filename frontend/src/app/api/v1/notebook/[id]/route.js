import { NextResponse } from 'next/server';
import { jsonError, proxyOrMock } from '@/app/api/v1/_mock/backend';
import { mockStore, visibleNotebook } from '@/app/api/v1/_mock/store';

async function update(req, id) {
  const store = mockStore(req);
  const item = visibleNotebook(store).find(it => it.theId === id);
  if (!item) return jsonError(404, 'NOT_FOUND', 'Không tìm thấy từ trong sổ tay');
  const body = await req.json().catch(() => ({}));
  if (body.ghiChu !== undefined) {
    const ghiChu = String(body.ghiChu || '').trim();
    if (ghiChu.length > 500) return jsonError(400, 'VALIDATION_FAILED', 'Dữ liệu không hợp lệ', [{ field: 'ghiChu', message: 'Ghi chú tối đa 500 ký tự' }]);
    item.ghiChu = ghiChu;
  }
  if (body.danhDauThuCong !== undefined) {
    item.danhDauThuCong = !!body.danhDauThuCong;
    item.lyDo = item.lyDo.filter(reason => reason !== 'DANH_DAU_THU_CONG');
    if (item.danhDauThuCong) item.lyDo.push('DANH_DAU_THU_CONG');
  }
  item.lanGanNhatAt = new Date().toISOString();
  return NextResponse.json(item);
}

function remove(req, id) {
  const store = mockStore(req);
  const item = store.notebook.find(it => it.theId === id);
  if (item) {
    item.danhDauThuCong = false;
    item.lyDo = item.lyDo.filter(reason => reason !== 'DANH_DAU_THU_CONG');
    store.hidden.add(id);
  }
  return new NextResponse(null, { status: 204 });
}

export async function PUT(req, { params }) {
  const { id } = await params;
  return proxyOrMock(req, `/api/v1/notebook/${encodeURIComponent(id)}`, () => update(req, id));
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  return proxyOrMock(req, `/api/v1/notebook/${encodeURIComponent(id)}`, () => remove(req, id));
}
