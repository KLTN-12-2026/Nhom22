'use strict';
import { NextResponse } from 'next/server';

if (!globalThis.__notebookStore) {
  globalThis.__notebookStore = [
    {
      theId: 'c1',
      tu: 'receipt',
      tuLoai: 'n.',
      phienAm: '/rɪˈsiːt/',
      nghiaVi: 'biên lai, giấy biên nhận',
      boTheId: '13',
      boTheTen: 'TOEIC Part 5 — từ hay sai của mình',
      nhomLoi: [
        { nhomLoi: 'CHINH_TA', soLan: 2 },
        { nhomLoi: 'NGHIA', soLan: 3 }
      ],
      lyDo: ['QUEN_NHIEU', 'SAI_CHINH_TA', 'DANH_DAU_THU_CONG'],
      soLanQuen: 3,
      ghiChu: '',
      danhDauThuCong: true,
      lanGanNhatAt: '2026-10-24T10:00:00Z',
      bangChung: [
        { nhomLoi: 'CHINH_TA', traLoi: 'reciept', dapAn: 'receipt', baiLuyenId: 'ses_1', createdAt: '2026-10-24T10:00:00Z' },
        { nhomLoi: 'NGHIA', traLoi: 'công thức nấu ăn', dapAn: 'biên lai, giấy biên nhận', baiLuyenId: 'ses_2', createdAt: '2026-10-21T10:00:00Z' },
        { nhomLoi: 'NGHIA', traLoi: '', dapAn: 'biên lai, giấy biên nhận', baiLuyenId: 'ses_3', createdAt: '2026-10-18T10:00:00Z' }
      ]
    },
    {
      theId: 'c2',
      tu: 'complimentary',
      tuLoai: 'adj.',
      phienAm: '/ˌkɑːmplɪˈmentri/',
      nghiaVi: 'miễn phí (tặng kèm); khác với complementary là "bổ sung"',
      boTheId: '13',
      boTheTen: 'TOEIC Part 5 — từ hay sai của mình',
      nhomLoi: [
        { nhomLoi: 'CAP_NHAM', soLan: 1 },
        { nhomLoi: 'NGHIA', soLan: 4 }
      ],
      lyDo: ['CAP_DE_NHAM'],
      soLanQuen: 0,
      ghiChu: '',
      danhDauThuCong: false,
      lanGanNhatAt: '2026-10-24T10:00:00Z',
      bangChung: [
        { nhomLoi: 'CAP_NHAM', traLoi: 'complementary', dapAn: 'complimentary', baiLuyenId: 'ses_4', createdAt: '2026-10-24T10:00:00Z' }
      ]
    },
    {
      theId: 'c3',
      tu: 'accommodate',
      tuLoai: 'v.',
      phienAm: '/əˈkɑː.mə.deɪt/',
      nghiaVi: 'đáp ứng, cung cấp chỗ ở',
      boTheId: '13',
      boTheTen: 'TOEIC Part 5 — từ hay sai của mình',
      nhomLoi: [
        { nhomLoi: 'CHINH_TA', soLan: 2 },
        { nhomLoi: 'NGHIA', soLan: 1 }
      ],
      lyDo: ['SAI_CHINH_TA'],
      soLanQuen: 1,
      ghiChu: 'Lưu ý 2 chữ c và 2 chữ m',
      danhDauThuCong: false,
      lanGanNhatAt: '2026-10-23T10:00:00Z',
      bangChung: [
        { nhomLoi: 'CHINH_TA', traLoi: 'acommodate', dapAn: 'accommodate', baiLuyenId: 'ses_5', createdAt: '2026-10-23T10:00:00Z' }
      ]
    },
    {
      theId: 'c4',
      tu: 'negligible',
      tuLoai: 'adj.',
      phienAm: '/ˈneɡ.lə.dʒə.bəl/',
      nghiaVi: 'không đáng kể, có thể bỏ qua',
      boTheId: '13',
      boTheTen: 'TOEIC Part 5 — từ hay sai của mình',
      nhomLoi: [
        { nhomLoi: 'NGHIA', soLan: 3 }
      ],
      lyDo: ['QUEN_NHIEU'],
      soLanQuen: 4,
      ghiChu: '',
      danhDauThuCong: false,
      lanGanNhatAt: '2026-10-22T10:00:00Z',
      bangChung: []
    },
    {
      theId: 'c5',
      tu: 'comprehensive',
      tuLoai: 'adj.',
      phienAm: '/ˌkɑːm.prəˈhen.sɪv/',
      nghiaVi: 'toàn diện, bao quát',
      boTheId: '13',
      boTheTen: 'TOEIC Part 5 — từ hay sai của mình',
      nhomLoi: [
        { nhomLoi: 'CAP_NHAM', soLan: 1 },
        { nhomLoi: 'NGHIA', soLan: 2 }
      ],
      lyDo: ['CAP_DE_NHAM'],
      soLanQuen: 1,
      ghiChu: '',
      danhDauThuCong: false,
      lanGanNhatAt: '2026-10-21T10:00:00Z',
      bangChung: []
    },
    {
      theId: 'c6',
      tu: 'feasible',
      tuLoai: 'adj.',
      phienAm: '/ˈfiː.zə.bəl/',
      nghiaVi: 'khả thi, có thể thực hiện được',
      boTheId: '13',
      boTheTen: 'TOEIC Part 5 — từ hay sai của mình',
      nhomLoi: [
        { nhomLoi: 'NGHIA', soLan: 2 }
      ],
      lyDo: [],
      soLanQuen: 2,
      ghiChu: '',
      danhDauThuCong: false,
      lanGanNhatAt: '2026-10-20T10:00:00Z',
      bangChung: []
    },
    {
      theId: 'c7',
      tu: 'subsequent',
      tuLoai: 'adj.',
      phienAm: '/ˈsʌb.sɪ.kwənt/',
      nghiaVi: 'xảy ra sau, theo sau',
      boTheId: '13',
      boTheTen: 'TOEIC Part 5 — từ hay sai của mình',
      nhomLoi: [
        { nhomLoi: 'NGHIA', soLan: 2 }
      ],
      lyDo: [],
      soLanQuen: 1,
      ghiChu: '',
      danhDauThuCong: false,
      lanGanNhatAt: '2026-10-20T10:00:00Z',
      bangChung: []
    },
    {
      theId: 'c8',
      tu: 'mandatory',
      tuLoai: 'adj.',
      phienAm: '/ˈmæn.də.tɔːr.i/',
      nghiaVi: 'bắt buộc theo quy định',
      boTheId: '13',
      boTheTen: 'TOEIC Part 5 — từ hay sai của mình',
      nhomLoi: [
        { nhomLoi: 'NGHIA', soLan: 1 }
      ],
      lyDo: ['DANH_DAU_THU_CONG'],
      soLanQuen: 0,
      ghiChu: 'Từ hay xuất hiện trong hợp đồng',
      danhDauThuCong: true,
      lanGanNhatAt: '2026-10-20T10:00:00Z',
      bangChung: []
    },
    {
      theId: 'c9',
      tu: 'preliminary',
      tuLoai: 'adj.',
      phienAm: '/prɪˈlɪm.ə.ner.i/',
      nghiaVi: 'sơ bộ, ban đầu',
      boTheId: '13',
      boTheTen: 'TOEIC Part 5 — từ hay sai của mình',
      nhomLoi: [
        { nhomLoi: 'NGHIA', soLan: 1 }
      ],
      lyDo: [],
      soLanQuen: 1,
      ghiChu: '',
      danhDauThuCong: false,
      lanGanNhatAt: '2026-10-13T10:00:00Z',
      bangChung: []
    },
    {
      theId: 'c10',
      tu: 'reimburse',
      tuLoai: 'v.',
      phienAm: '/ˌriː.ɪmˈbɝːs/',
      nghiaVi: 'hoàn lại, bồi hoàn chi phí',
      boTheId: '13',
      boTheTen: 'TOEIC Part 5 — từ hay sai của mình',
      nhomLoi: [
        { nhomLoi: 'CHINH_TA', soLan: 1 },
        { nhomLoi: 'NGHIA', soLan: 1 }
      ],
      lyDo: [],
      soLanQuen: 1,
      ghiChu: '',
      danhDauThuCong: false,
      lanGanNhatAt: '2026-10-13T10:00:00Z',
      bangChung: []
    },
    {
      theId: 'c11',
      tu: 'unprecedented',
      tuLoai: 'adj.',
      phienAm: '/ʌnˈpres.ə.den.t̬ɪd/',
      nghiaVi: 'chưa từng có tiền lệ',
      boTheId: '13',
      boTheTen: 'TOEIC Part 5 — từ hay sai của mình',
      nhomLoi: [
        { nhomLoi: 'NGHIA', soLan: 1 }
      ],
      lyDo: [],
      soLanQuen: 1,
      ghiChu: '',
      danhDauThuCong: false,
      lanGanNhatAt: '2026-10-13T10:00:00Z',
      bangChung: []
    }
  ];
}

async function tryProxyToBackend(req) {
  const beBase = (process.env.API_URL || 'http://localhost:8080').replace(/\/$/, '');
  const url = `${beBase}/api/v1/notebook${req.nextUrl.search}`;
  try {
    const headers = new Headers();
    const cookie = req.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    const xsrf = req.headers.get('x-xsrf-token');
    if (xsrf) headers.set('x-xsrf-token', xsrf);

    const beRes = await fetch(url, { method: req.method, headers });
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

  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '0', 10);
  const size = parseInt(searchParams.get('size') || '20', 10);
  const nhomLoi = searchParams.get('nhomLoi') || '';

  const all = globalThis.__notebookStore;

  const tongHop = {
    TAT_CA: all.length,
    NGHIA: 0,
    CHINH_TA: 0,
    NGHE: 0,
    NGU_CANH: 0,
    CAP_NHAM: 0,
    QUEN_NHIEU: 0,
    DANH_DAU: 0
  };

  all.forEach(it => {
    (it.nhomLoi || []).forEach(g => {
      if (tongHop[g.nhomLoi] !== undefined) tongHop[g.nhomLoi]++;
    });
    if (it.soLanQuen >= 3) tongHop.QUEN_NHIEU++;
    if (it.danhDauThuCong) tongHop.DANH_DAU++;
  });

  let filtered = all;
  if (nhomLoi) {
    if (nhomLoi === 'QUEN_NHIEU') {
      filtered = all.filter(it => it.soLanQuen >= 3);
    } else if (nhomLoi === 'DANH_DAU') {
      filtered = all.filter(it => it.danhDauThuCong);
    } else {
      filtered = all.filter(it => (it.nhomLoi || []).some(g => g.nhomLoi === nhomLoi));
    }
  }

  const totalElements = filtered.length;
  const totalPages = Math.ceil(totalElements / size) || 1;
  const pagedItems = filtered.slice(page * size, (page + 1) * size);

  return NextResponse.json({
    tongHop,
    items: pagedItems,
    page,
    size,
    totalElements,
    totalPages
  });
}
