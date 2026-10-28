'use strict';
import { NextResponse } from 'next/server';

const CONFUSING_PAIRS = [
  {
    id: 'p1',
    the1: { id: 'c1', tu: 'receipt', tuLoai: 'n', phienAm: '/rɪˈsiːt/', nghiaVi: 'biên lai, giấy biên nhận' },
    the2: { id: 'c12', tu: 'recipe', tuLoai: 'n', phienAm: '/ˈres.ə.pi/', nghiaVi: 'công thức nấu ăn' },
    loaiNham: 'HINH_THUC_GAN_GIONG',
    soLan: 3,
    ganNhatAt: '2026-10-18T10:00:00Z'
  },
  {
    id: 'p2',
    the1: { id: 'c2', tu: 'complimentary', tuLoai: 'adj', phienAm: '/ˌkɑːmplɪˈmentri/', nghiaVi: 'miễn phí (tặng kèm); khác với complementary là "bổ sung"' },
    the2: { id: 'c13', tu: 'complementary', tuLoai: 'adj', phienAm: '/ˌkɑːmplɪˈmentri/', nghiaVi: 'bổ sung cho nhau, bổ trợ' },
    loaiNham: 'HINH_THUC_GAN_GIONG',
    soLan: 3,
    ganNhatAt: '2026-10-13T10:00:00Z'
  },
  {
    id: 'p3',
    the1: { id: 'c14', tu: "How's it going?", tuLoai: 'phrase', phienAm: '', nghiaVi: 'Dạo này thế nào? (chào hỏi thân mật)' },
    the2: { id: 'c15', tu: "I'm running late", tuLoai: 'phrase', phienAm: '', nghiaVi: 'Tôi đang bị trễ' },
    loaiNham: 'NGHIA_GAN_NHAU',
    soLan: 2,
    ganNhatAt: '2026-10-16T10:00:00Z'
  },
  {
    id: 'p4',
    the1: { id: 'c2', tu: 'complimentary', tuLoai: 'adj', phienAm: '/ˌkɑːmplɪˈmentri/', nghiaVi: 'miễn phí (tặng kèm)' },
    the2: { id: 'c16', tu: 'appreciate', tuLoai: 'v', phienAm: '/əˈpriː.ʃi.eɪt/', nghiaVi: 'trân trọng, biết ơn' },
    loaiNham: 'HINH_THUC_GAN_GIONG',
    soLan: 2,
    ganNhatAt: '2026-10-14T10:00:00Z'
  }
];

async function tryProxyToBackend(req) {
  const beBase = (process.env.API_URL || 'http://localhost:8080').replace(/\/$/, '');
  const url = `${beBase}/api/v1/learning/confusing-pairs`;
  try {
    const headers = new Headers();
    const cookie = req.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);
    const beRes = await fetch(url, { headers });
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

export async function GET(req) {
  const proxy = await tryProxyToBackend(req);
  if (proxy) return proxy;

  return NextResponse.json(CONFUSING_PAIRS);
}
