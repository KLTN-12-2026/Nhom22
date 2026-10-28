'use strict';
import { NextResponse } from 'next/server';

async function tryProxyToBackend(req, id) {
  const beBase = (process.env.API_URL || 'http://localhost:8080').replace(/\/$/, '');
  const url = `${beBase}/api/v1/notebook/${id}`;
  try {
    const headers = new Headers();
    const cookie = req.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    const xsrf = req.headers.get('x-xsrf-token');
    if (xsrf) headers.set('x-xsrf-token', xsrf);

    const init = { method: req.method, headers };
    if (req.method === 'PUT') {
      init.body = await req.clone().text();
    }
    const beRes = await fetch(url, init);
    if ([200, 201, 204].includes(beRes.status)) {
      const resBody = await beRes.text();
      return new NextResponse(resBody, {
        status: beRes.status,
        headers: { 'content-type': beRes.headers.get('content-type') || 'application/json' }
      });
    }
  } catch (e) {}
  return null;
}

export async function PUT(req, { params }) {
  const { id } = await params;
  const proxy = await tryProxyToBackend(req, id);
  if (proxy) return proxy;

  const body = await req.json().catch(() => ({}));
  const store = globalThis.__notebookStore || [];
  const item = store.find(it => it.theId === id);

  if (!item) {
    return NextResponse.json({ code: 'NOT_FOUND', message: 'Không tìm thấy từ trong sổ tay' }, { status: 404 });
  }

  if (body.ghiChu !== undefined) {
    item.ghiChu = String(body.ghiChu || '').trim();
  }
  if (body.danhDauThuCong !== undefined) {
    item.danhDauThuCong = !!body.danhDauThuCong;
    if (item.danhDauThuCong && !item.lyDo.includes('DANH_DAU_THU_CONG')) {
      item.lyDo.push('DANH_DAU_THU_CONG');
    } else if (!item.danhDauThuCong) {
      item.lyDo = item.lyDo.filter(r => r !== 'DANH_DAU_THU_CONG');
    }
  }
  item.lanGanNhatAt = new Date().toISOString();

  return NextResponse.json(item);
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const proxy = await tryProxyToBackend(req, id);
  if (proxy) return proxy;

  if (globalThis.__notebookStore) {
    globalThis.__notebookStore = globalThis.__notebookStore.filter(it => it.theId !== id);
  }

  return new NextResponse(null, { status: 204 });
}
