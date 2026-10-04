import { http, HttpResponse, delay } from 'msw';

let mockSessionStatus = 'DANG_HOC';
let mockPracticeStatus = 'DANG_LAM';
let mockCurrentUser = null;

export const handlers = [
  // Ping
  http.get('*/api/v1/public/ping', () => {
    return HttpResponse.json({ message: 'pong from msw' });
  }),
  
  // Auth
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const body = await request.json().catch(() => ({}));
    if (body.email === 'admin@vocab.local') {
      mockCurrentUser = { id: 'admin1', email: 'admin@vocab.local', tenHienThi: 'Admin', vaiTro: ['USER', 'ADMIN'] };
    } else if (body.email === 'binh@vocab.local') {
      mockCurrentUser = { id: 'u2', email: 'binh@vocab.local', tenHienThi: 'Bình', vaiTro: ['USER'] };
    } else {
      mockCurrentUser = { id: 'u1', email: 'an@vocab.local', tenHienThi: 'An', vaiTro: ['USER'] };
    }
    return HttpResponse.json({ message: 'Login success' });
  }),
  http.post('*/api/v1/auth/logout', () => {
    mockCurrentUser = null;
    return HttpResponse.json({ success: true });
  }),
  http.get('*/api/v1/me', () => {
    if (!mockCurrentUser) {
      return new HttpResponse(null, { status: 401 });
    }
    return HttpResponse.json(mockCurrentUser);
  }),
  http.post('*/api/v1/auth/register', () => {
    return HttpResponse.json({ message: 'Register success' });
  }),
  http.post('*/api/v1/auth/verify-email', () => {
    return HttpResponse.json({ message: 'Verify success' });
  }),
  http.post('*/api/v1/auth/resend-verification', () => {
    return HttpResponse.json({ message: 'Resend success' });
  }),
  http.post('*/api/v1/auth/forgot-password', () => {
    return HttpResponse.json({ message: 'Forgot success', demoToken: 'mock-reset-token-123' });
  }),
  http.post('*/api/v1/auth/reset-password', () => {
    return HttpResponse.json({ message: 'Reset success' });
  }),

  // Me
  http.get('*/api/v1/me', () => {
    return HttpResponse.json({
      id: 'u1',
      tenHienThi: 'Người học Demo',
      email: 'demo@gmail.com',
      vaiTro: ['USER'],
      trangThai: 'HOAT_DONG',
      muiGio: 'Asia/Ho_Chi_Minh',
    });
  }),

  // My Decks
  http.get('*/api/v1/decks/my-decks', () => {
    return HttpResponse.json([
      { id: '1', name: '3000 từ vựng Oxford (Mock)', goal: 'GIAO_TIEP', level: 'CO_BAN', cardCount: 3000 },
      { id: '2', name: 'IT Tiếng Anh (Mock)', goal: 'TOEIC', level: 'TRUNG_CAP', cardCount: 150 },
    ]);
  }),

  // Deck details
  http.get('*/api/v1/decks/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: `Bộ thẻ demo (${params.id})`,
      description: 'Mô tả ngắn gọn về bộ thẻ này.',
      goal: 'GIAO_TIEP',
      level: 'CO_BAN',
      visibility: 'RIENG_TU',
      topicName: 'Giao tiếp',
      cardCount: 2,
      updatedAt: '2026-09-30T10:00:00Z',
      cards: [
        { id: 'c1', word: 'receipt', ipa: '/rɪˈsiːt/', pos: 'n.', meaningVi: 'biên lai, giấy biên nhận', exampleEn: 'Can I have a receipt, please?' },
        { id: 'c2', word: 'postpone', ipa: '/pəʊstˈpəʊn/', pos: 'v.', meaningVi: 'hoãn lại', exampleEn: 'The meeting has been postponed until Friday.' },
      ]
    });
  }),

  // Create Deck
  http.post('*/api/v1/decks', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      id: 'mock-new-id-' + Math.floor(Math.random() * 1000),
      ...data
    });
  }),

  // Add Card
  http.post('*/api/v1/decks/:id/cards', async ({ request, params }) => {
    const data = await request.json();
    return HttpResponse.json({
      id: 'mock-card-' + Math.floor(Math.random() * 1000),
      deckId: params.id,
      ...data
    });
  }),

  // Topics
  http.get('*/api/v1/public/topics', () => {
    return HttpResponse.json([
      { id: '1', name: 'Giao tiếp', deckCount: 12 },
      { id: '2', name: 'TOEIC', deckCount: 5 },
      { id: '3', name: 'Kinh doanh', deckCount: 3 }
    ]);
  }),

  // Library Decks
  http.get('*/api/v1/library/decks', () => {
    return HttpResponse.json({
      items: [
        { id: '1', name: 'Giao tiếp cơ bản (MSW)', description: 'Từ vựng cần thiết cho giao tiếp hàng ngày', kind: 'MAU', topicName: 'Giao tiếp', level: 'CO_BAN', goal: 'GIAO_TIEP', cardCount: 150, updatedAt: '2026-09-29T10:00:00Z' },
        { id: '2', name: 'TOEIC 600+ (MSW)', description: 'Từ vựng luyện thi TOEIC', kind: 'CHIA_SE', topicName: 'TOEIC', level: 'TRUNG_CAP', goal: 'TOEIC', cardCount: 600, updatedAt: '2026-09-28T10:00:00Z' }
      ],
      totalElements: 2
    });
  }),

  // Learning Today
  http.get('*/api/v1/learning/today', () => {
    return HttpResponse.json({
      tongSoThe: 150,
      cuuLichOn: null,
      soQuaHan: 12,
      soDenHan: 5,
      soMoiConLai: 10,
      uocTinhPhut: 8,
      soTheMoiDaHoc: 0,
      tuMoiMoiNgay: 10,
      giayMoiLuot: 12,
      chuoiNgay: 3,
      homNayDaTinhChuoi: false,
      luotToiThieuChuoi: 15,
      daHocHomNay: { soPhut: 0, soLuot: 0 },
      phutMoiNgay: 10,
      boThe: [
        { boTheId: '1', ten: '3000 từ vựng Oxford', soCanOn: 17, soMoi: 10 }
      ]
    });
  }),

  // Create Learning Session
  http.post('*/api/v1/learning/sessions', async () => {
    return HttpResponse.json({
      id: 'session-123'
    });
  }),

  // Get Learning Session Details
  http.get('*/api/v1/learning/sessions/:id', ({ params }) => {
    const futureTime = new Date(Date.now() + 10 * 60000).toISOString();
    return HttpResponse.json({
      id: params.id,
      boTheTen: '3000 từ vựng Oxford (Mock)',
      chieuHoc: 'EN_VI',
      cheDo: 'THUONG',
      trangThai: mockSessionStatus,
      quyThoiGian: 10,
      hetGioAt: futureTime,
      hangDoi: [
        {
          theId: 'c1',
          thuTu: 1,
          trangThai: 'CHO',
          tienDo: { trangThai: 'MOI', hanOnAt: null, version: 1 },
          duKien: { QUEN: '1 phút', KHO: '5 phút', NHO: '1 ngày', DE: '4 ngày' },
          the: { tu: 'receipt', phienAm: '/rɪˈsiːt/', tuLoai: 'n.', nghiaVi: 'biên lai, giấy biên nhận', viDuEn: 'Can I have a receipt, please?' }
        }
      ],
      tongKet: mockSessionStatus === 'KET_THUC' ? {
        boTheTen: '3000 từ vựng Oxford (Mock)',
        chieuHoc: 'EN_VI',
        soLuot: 12,
        soThe: 10,
        soTheMoi: 2,
        quyThoiGian: 10,
        thoiGianGiay: 125,
        theoDanhGia: { QUEN: 1, KHO: 2, NHO: 5, DE: 4 },
        tuCanLuyen: [
          { theId: 'c1', tu: 'receipt', nghiaVi: 'biên lai, giấy biên nhận', danhGia: ['QUEN'] }
        ],
        lichTiepTheo: [
          { theId: 'c2', tu: 'postpone', trangThai: 'ON_TAP', hanOnAt: futureTime, khoangHienThi: '1 ngày' }
        ],
        chuoiNgay: 3,
        homNayDaTinhChuoi: true,
        luotToiThieuChuoi: 15
      } : null
    });
  }),

  // Submit Review
  http.post('*/api/v1/learning/sessions/:id/reviews', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      tienDo: { trangThai: 'DA_ON', hanOnAt: new Date(Date.now() + 60000).toISOString(), version: 2 },
      duKien: { QUEN: '1 phút', KHO: '5 phút', NHO: '2 ngày', DE: '5 ngày' },
      laiTrongPhien: data.danhGia === 'QUEN' || data.danhGia === 'KHO',
      khoangHienThi: data.danhGia === 'NHO' ? '1 ngày' : '1 phút'
    });
  }),

  // Finish Session
  http.post('*/api/v1/learning/sessions/:id/finish', () => {
    mockSessionStatus = 'KET_THUC';
    return HttpResponse.json({ message: 'Session finished' });
  }),

  // Get Learning History
  http.get('*/api/v1/learning/history', () => {
    return HttpResponse.json({
      items: [
        { tu: 'receipt', danhGia: 'QUEN', sau: { trangThai: 'DANG_HOC' }, createdAt: new Date().toISOString() },
        { tu: 'postpone', danhGia: 'NHO', sau: { trangThai: 'ON_TAP' }, createdAt: new Date(Date.now() - 60000).toISOString() }
      ]
    });
  }),

  // Practice History
  http.get('*/api/v1/practice/history', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    return HttpResponse.json({
      items: [
        { baiLuyenId: '123', loaiBai: 'TONG_HOP', boTheTen: '3000 từ vựng Oxford (Mock)', diem: 80, tongSoCau: 2, soCauDung: 1, soCauSai: 1, thoiGianMs: 120000, laLuyenLai: false, nopAt: new Date().toISOString() },
        { baiLuyenId: 'p2', loaiBai: 'NGHE_VIET', boTheTen: 'Từ vựng Ielts', diem: 100, tongSoCau: 5, soCauDung: 5, soCauSai: 0, thoiGianMs: 45000, laLuyenLai: true, nopAt: new Date(Date.now() - 86400000).toISOString() }
      ],
      totalElements: 2,
      totalPages: 1,
      page,
      size
    });
  }),

  // Create Practice Session
  http.post('*/api/v1/practice/sessions', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({
      id: 'practice-session-' + Math.floor(Math.random() * 1000),
      ...data
    });
  }),

  // Get Practice Session
  http.get('*/api/v1/practice/sessions/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      loaiBai: 'TONG_HOP',
      laLuyenLai: false,
      boTheTen: '3000 từ vựng Oxford (Mock)',
      soCau: 3,
      soCauYeuCau: 10,
      daNop: mockPracticeStatus === 'DA_NOP',
      cauHoi: mockPracticeStatus === 'DANG_LAM' ? [
        {
          id: 'q1',
          thuTu: 1,
          loaiCau: 'CHON_NGHIA',
          deBai: { tu: 'receipt', phienAm: '/rɪˈsiːt/', tuLoai: 'n.' },
          phuongAn: [
            { id: 'o1', noiDung: 'biên lai' },
            { id: 'o2', noiDung: 'hoá đơn' },
            { id: 'o3', noiDung: 'đơn hàng' },
            { id: 'o4', noiDung: 'thẻ' }
          ]
        },
        {
          id: 'q2',
          thuTu: 2,
          loaiCau: 'DIEN_CHO_TRONG',
          deBai: { cau: 'Can I have a _____, please?', goiY: 'biên lai', tuLoai: 'n.' }
        }
      ] : [],
      ketQua: mockPracticeStatus === 'DA_NOP' ? {
        lanLamId: '123',
        loaiBai: 'TONG_HOP',
        laLuyenLai: false,
        boTheTen: '3000 từ vựng Oxford (Mock)',
        nopAt: new Date().toISOString(),
        diem: 80,
        thoiGianMs: 120000,
        tongSoCau: 2,
        soCauDung: 1,
        theoKyNang: [
          { kyNang: 'DOC_HIEU', tong: 2, dung: 1 }
        ],
        ketQua: [
          {
            thuTu: 1,
            loaiCau: 'CHON_NGHIA',
            dung: true,
            deBai: { tu: 'receipt' },
            traLoi: { noiDung: 'biên lai' },
            dapAn: { noiDung: 'biên lai' },
            giaiThich: { tu: 'receipt', nghiaVi: 'biên lai', phienAm: '/rɪˈsiːt/' }
          },
          {
            thuTu: 2,
            loaiCau: 'DIEN_CHO_TRONG',
            dung: false,
            nhomLoi: 'CHINH_TA',
            deBai: { cau: 'Can I have a _____, please?', goiY: 'biên lai' },
            traLoi: { noiDung: 'recept' },
            dapAn: { noiDung: 'receipt' },
            giaiThich: { tu: 'receipt', nghiaVi: 'biên lai', phienAm: '/rɪˈsiːt/' }
          }
        ]
      } : null
    });
  }),

  // Submit Practice Session
  http.post('*/api/v1/practice/sessions/:id/submissions', () => {
    mockPracticeStatus = 'DA_NOP';
    return HttpResponse.json({ message: 'Success' });
  }),
  
  // Retry Practice Mistakes
  http.post('*/api/v1/practice/mistakes/retry', () => {
    mockPracticeStatus = 'DANG_LAM';
    return HttpResponse.json({ id: 'practice-retry-123' });
  }),

  // Notebook List
  http.get('*/api/v1/notebook', ({ request }) => {
    const url = new URL(request.url);
    const nhomLoi = url.searchParams.get('nhomLoi');
    
    return HttpResponse.json({
      items: [
        {
          theId: 'c1',
          boTheId: 'b1',
          boTheTen: '3000 từ vựng Oxford',
          tu: 'receipt',
          phienAm: '/rɪˈsiːt/',
          tuLoai: 'n.',
          nghiaVi: 'biên lai, giấy biên nhận',
          lyDo: ['QUEN_NHIEU', 'SAI_CHINH_TA'],
          nhomLoi: [{ nhomLoi: 'CHINH_TA', soLan: 2 }],
          soLanQuen: 3,
          danhDauThuCong: false,
          ghiChu: 'Hay quên cách viết ei/ie',
          lanGanNhatAt: new Date().toISOString(),
          bangChung: [
            { nhomLoi: 'CHINH_TA', traLoi: 'recept', dapAn: 'receipt', createdAt: new Date().toISOString() }
          ]
        },
        {
          theId: 'c2',
          boTheId: 'b1',
          boTheTen: '3000 từ vựng Oxford',
          tu: 'postpone',
          tuLoai: 'v.',
          nghiaVi: 'hoãn lại',
          lyDo: ['DANH_DAU_THU_CONG'],
          nhomLoi: [],
          danhDauThuCong: true,
          ghiChu: '',
          lanGanNhatAt: new Date().toISOString(),
          bangChung: []
        }
      ].filter(x => !nhomLoi || (nhomLoi === 'DANH_DAU' && x.danhDauThuCong) || x.nhomLoi.some(n => n.nhomLoi === nhomLoi)),
      tongHop: {
        TAT_CA: 2,
        CHINH_TA: 1,
        DANH_DAU: 1
      },
      totalElements: 2,
      totalPages: 1,
      page: 0,
      size: 20
    });
  }),

  // Notebook Update
  http.put('*/api/v1/notebook/:id', async ({ request, params }) => {
    return HttpResponse.json({ success: true });
  }),

  // Notebook Delete
  http.delete('*/api/v1/notebook/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // Confusing Pairs
  http.get('*/api/v1/learning/confusing-pairs', () => {
    return HttpResponse.json([
      {
        loaiNham: 'HINH_THUC_GAN_GIONG',
        soLan: 3,
        ganNhatAt: new Date().toISOString(),
        the1: { id: 'c1', tu: 'receipt', nghiaVi: 'biên lai' },
        the2: { id: 'c3', tu: 'recipe', nghiaVi: 'công thức' }
      }
    ]);
  }),

  // Statistics Overview
  http.get('*/api/v1/statistics/overview', ({ request }) => {
    const url = new URL(request.url);
    const tuNgay = url.searchParams.get('tuNgay');
    const denNgay = url.searchParams.get('denNgay');
    
    // Simulate some daily data between tuNgay and denNgay
    let theoNgay = [];
    if (tuNgay && denNgay) {
      let start = new Date(tuNgay);
      const end = new Date(denNgay);
      let limit = 0;
      while (start <= end && limit < 100) {
        const isToday = new Date().toISOString().split('T')[0] === start.toISOString().split('T')[0];
        theoNgay.push({
          ngay: start.toISOString().split('T')[0],
          soLuotOn: isToday ? 25 : Math.floor(Math.random() * 50),
          soCauLuyen: isToday ? 10 : Math.floor(Math.random() * 20),
          soPhut: isToday ? 35 : Math.floor(Math.random() * 45)
        });
        start.setDate(start.getDate() + 1);
        limit++;
      }
    }
    
    return HttpResponse.json({
      tuNgay,
      denNgay,
      soTuDaHoc: 150,
      soLuotOn: 320,
      tyLeNho: 78,
      baiLuyen: {
        soBai: 15,
        tongSoCau: 150,
        soCauDung: 120,
        tyLeDung: 80
      },
      mucTieuPhutNgay: 30,
      tongPhut: 450,
      soNgayCoHoc: theoNgay.filter(d => d.soLuotOn > 0 || d.soCauLuyen > 0).length,
      soNgayDatMucTieu: theoNgay.filter(d => d.soPhut >= 30).length,
      chuoiNgay: 5,
      theoNgay
    });
  }),

  // Statistics Skills
  http.get('*/api/v1/statistics/skills', () => {
    return HttpResponse.json([
      { kyNang: 'NHAN_NGHIA', mucLamChu: 85, duDuLieu: true, tyLeDungLanDau: 75, tyLeDungSauLuyenLai: 90, soQuanSat: 50, soQuanSatToiThieu: 5 },
      { kyNang: 'VIET', mucLamChu: 60, duDuLieu: true, tyLeDungLanDau: 50, tyLeDungSauLuyenLai: 80, soQuanSat: 40, soQuanSatToiThieu: 5 },
      { kyNang: 'NGHE', mucLamChu: null, duDuLieu: false, tyLeDungLanDau: null, tyLeDungSauLuyenLai: null, soQuanSat: 2, soQuanSatToiThieu: 5, soLuotTinh: 2 },
      { kyNang: 'NGU_CANH', mucLamChu: 70, duDuLieu: true, tyLeDungLanDau: 65, tyLeDungSauLuyenLai: 85, soQuanSat: 30, soQuanSatToiThieu: 5 },
      { kyNang: 'CAP_NHAM', mucLamChu: null, duDuLieu: false, tyLeDungLanDau: null, tyLeDungSauLuyenLai: null, soQuanSat: 0, soQuanSatToiThieu: 5, soLuotTinh: 0 }
    ]);
  }),

  // Admin Users List
  http.get('*/api/v1/admin/users', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() || '';
    const trangThai = url.searchParams.get('trangThai') || '';
    const vaiTro = url.searchParams.get('vaiTro') || '';
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);

    let users = [
      { id: 'u1', tenHienThi: 'Admin Test', email: 'admin@vocab.local', anhDaiDien: '', trangThai: 'HOAT_DONG', vaiTro: ['USER', 'ADMIN'], soBoThe: 5, createdAt: '2025-01-01T10:00:00Z', dangNhapCuoiAt: new Date().toISOString() },
      { id: 'u2', tenHienThi: 'User Test 1', email: 'user1@vocab.local', anhDaiDien: '', trangThai: 'HOAT_DONG', vaiTro: ['USER'], soBoThe: 12, createdAt: '2026-02-15T08:30:00Z', dangNhapCuoiAt: new Date().toISOString() },
      { id: 'u3', tenHienThi: 'Blocked User', email: 'blocked@vocab.local', anhDaiDien: '', trangThai: 'BI_KHOA', vaiTro: ['USER'], soBoThe: 0, createdAt: '2026-05-10T14:20:00Z', dangNhapCuoiAt: '2026-06-01T09:00:00Z' },
      { id: 'u4', tenHienThi: 'Unverified', email: 'unverified@vocab.local', anhDaiDien: '', trangThai: 'CHUA_XAC_THUC', vaiTro: ['USER'], soBoThe: 0, createdAt: new Date().toISOString(), dangNhapCuoiAt: null }
    ];

    if (q) {
      users = users.filter(u => u.email.toLowerCase().includes(q) || u.tenHienThi.toLowerCase().includes(q));
    }
    if (trangThai) {
      users = users.filter(u => u.trangThai === trangThai);
    }
    if (vaiTro) {
      users = users.filter(u => u.vaiTro.includes(vaiTro));
    }

    const totalElements = users.length;
    const totalPages = Math.ceil(totalElements / size);
    const items = users.slice(page * size, (page + 1) * size);

    return HttpResponse.json({
      items,
      totalElements,
      totalPages,
      page,
      size
    });
  }),

  // Admin Update User Status
  http.patch('*/api/v1/admin/users/:id/status', async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, soPhienDaHuy: body.trangThai === 'BI_KHOA' ? 2 : 0 });
  }),

  // Admin Update User Roles
  http.put('*/api/v1/admin/users/:id/roles', async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true });
  }),

  // Admin Topics
  http.get('*/api/v1/admin/topics', () => {
    return HttpResponse.json([
      { id: 't1', name: 'Giao tiếp' },
      { id: 't2', name: 'TOEIC' },
      { id: 't3', name: 'IELTS' }
    ]);
  }),

  // Admin Decks List
  http.get('*/api/v1/admin/decks', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() || '';
    const trangThai = url.searchParams.get('trangThai') || '';
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);

    let decks = [
      { id: 'd1', ten: 'Bộ mẫu nháp', moTa: 'Đang làm dở', quyenTruyCap: 'RIENG_TU', trangThaiKiemDuyet: 'BINH_THUONG', mucTieu: 'GIAO_TIEP', chuDeTen: 'Giao tiếp', trinhDo: 'A1', soThe: 0, soBanSao: 0, updatedAt: new Date().toISOString(), version: 1 },
      { id: 'd2', ten: '3000 từ Oxford', moTa: 'Từ vựng cốt lõi', quyenTruyCap: 'CONG_KHAI', trangThaiKiemDuyet: 'BINH_THUONG', mucTieu: 'TOEIC', chuDeTen: 'TOEIC', trinhDo: 'B1', soThe: 3000, soBanSao: 1500, updatedAt: new Date().toISOString(), version: 2 },
      { id: 'd3', ten: 'Bộ bị ẩn', moTa: 'Có chứa lỗi sai', quyenTruyCap: 'CONG_KHAI', trangThaiKiemDuyet: 'DA_AN', mucTieu: 'IELTS', chuDeTen: 'IELTS', trinhDo: 'C1', soThe: 50, soBanSao: 10, updatedAt: new Date().toISOString(), version: 1 }
    ];

    if (q) decks = decks.filter(d => d.ten.toLowerCase().includes(q));
    if (trangThai === 'BAN_NHAP') decks = decks.filter(d => d.quyenTruyCap === 'RIENG_TU' && d.trangThaiKiemDuyet !== 'DA_AN');
    if (trangThai === 'DA_XUAT_BAN') decks = decks.filter(d => d.quyenTruyCap === 'CONG_KHAI' && d.trangThaiKiemDuyet !== 'DA_AN');
    if (trangThai === 'DA_AN') decks = decks.filter(d => d.trangThaiKiemDuyet === 'DA_AN');

    const totalElements = decks.length;
    const totalPages = Math.ceil(totalElements / size);
    const items = decks.slice(page * size, (page + 1) * size);

    return HttpResponse.json({ items, totalElements, totalPages, page, size });
  }),

  // Admin Deck By Id
  http.get('*/api/v1/admin/decks/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id, ten: 'Bộ mẫu chi tiết', moTa: 'Mô tả chi tiết', quyenTruyCap: 'CONG_KHAI', trangThaiKiemDuyet: 'BINH_THUONG', mucTieu: 'GIAO_TIEP', chuDeId: 't1', chuDeTen: 'Giao tiếp', trinhDo: 'A1', soThe: 2, soBanSao: 10, updatedAt: new Date().toISOString(), version: 1
    });
  }),
  http.post('*/api/v1/admin/decks', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'd_new', ...body, soThe: 0, soBanSao: 0, version: 1 });
  }),
  http.patch('*/api/v1/admin/decks/:id', async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ id: params.id, ...body });
  }),
  http.delete('*/api/v1/admin/decks/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // Admin Cards
  http.get('*/api/v1/admin/cards', () => {
    return HttpResponse.json([
      { id: 'c1', tu: 'hello', nghiaVi: 'xin chào', tuLoai: 'exclam.', phienAm: '/həˈloʊ/', viDuEn: 'Hello there!', dichVi: 'Chào đằng ấy!', version: 1 },
      { id: 'c2', tu: 'world', nghiaVi: 'thế giới', tuLoai: 'n.', phienAm: '/wɜːrld/', viDuEn: 'Hello world!', dichVi: 'Chào thế giới!', version: 1 }
    ]);
  }),
  http.post('*/api/v1/admin/cards', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ id: 'c_new', ...body, version: 1 });
  }),
  http.patch('*/api/v1/admin/cards/:id', async ({ request, params }) => {
    const body = await request.json();
    return HttpResponse.json({ id: params.id, ...body, version: (body.version || 1) + 1 });
  }),
  http.delete('*/api/v1/admin/cards/:id', () => {
    return HttpResponse.json({ success: true });
  }),

  // Admin Audit Logs
  http.get('*/api/v1/admin/audit-logs', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() || '';
    const hanhDong = url.searchParams.get('hanhDong') || '';
    const loai = url.searchParams.get('loai') || '';
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);

    let logs = [
      { id: 'l1', hanhDong: 'KHOA_TAI_KHOAN', doiTuong: { loai: 'NGUOI_DUNG', id: 'u2', ten: 'User Test 1' }, nguoiThucHien: { tenHienThi: 'Admin Test' }, createdAt: new Date().toISOString(), lyDo: 'Vi phạm quy định', truoc: { trangThai: 'HOAT_DONG' }, sau: { trangThai: 'BI_KHOA' } },
      { id: 'l2', hanhDong: 'XUAT_BAN_BO_MAU', doiTuong: { loai: 'BO_THE', id: 'd2', ten: '3000 từ Oxford' }, nguoiThucHien: { tenHienThi: 'Admin Test' }, createdAt: new Date(Date.now() - 86400000).toISOString(), lyDo: '', truoc: { quyenTruyCap: 'RIENG_TU' }, sau: { quyenTruyCap: 'CONG_KHAI' } },
      { id: 'l3', hanhDong: 'CAP_QUYEN_QUAN_TRI', doiTuong: { loai: 'NGUOI_DUNG', id: 'u1', ten: 'Admin Test' }, nguoiThucHien: { tenHienThi: 'Super Admin' }, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), lyDo: 'Cấp quyền theo yêu cầu', truoc: { vaiTro: ['USER'] }, sau: { vaiTro: ['USER', 'ADMIN'] } }
    ];

    if (q) {
      logs = logs.filter(l => l.doiTuong.ten.toLowerCase().includes(q) || l.nguoiThucHien.tenHienThi.toLowerCase().includes(q) || (l.lyDo && l.lyDo.toLowerCase().includes(q)));
    }
    if (hanhDong) logs = logs.filter(l => l.hanhDong === hanhDong);
    if (loai) logs = logs.filter(l => l.doiTuong.loai === loai);

    const totalElements = logs.length;
    const totalPages = Math.ceil(totalElements / size);
    const items = logs.slice(page * size, (page + 1) * size);

    return HttpResponse.json({ items, totalElements, totalPages, page, size });
  }),

  // Deck Progress
  http.get('*/api/v1/decks/:id/progress', ({ request, params }) => {
    const url = new URL(request.url);
    const nhom = url.searchParams.get('nhom') || '';
    const q = url.searchParams.get('q')?.toLowerCase() || '';
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);

    let items = [
      {
        theId: 'c1', tu: 'hello', phienAm: '/həˈloʊ/', tuLoai: 'exclam.', nghiaVi: 'xin chào', tamNgung: false,
        chieu: {
          EN_VI: { nhom: 'MOI', trangThai: 'MOI', khoangHienThi: '1 phút' },
          VI_EN: { nhom: 'MOI', trangThai: 'MOI', khoangHienThi: '1 phút' }
        }
      },
      {
        theId: 'c2', tu: 'world', phienAm: '/wɜːrld/', tuLoai: 'n.', nghiaVi: 'thế giới', tamNgung: false,
        chieu: {
          EN_VI: { nhom: 'DANG_HOC', trangThai: 'ON_TAP', khoangHienThi: '3 ngày' },
          VI_EN: { nhom: 'DEN_HAN', trangThai: 'ON_TAP', hanOnAt: new Date().toISOString() }
        }
      },
      {
        theId: 'c3', tu: 'apple', phienAm: '/ˈæp.əl/', tuLoai: 'n.', nghiaVi: 'quả táo', tamNgung: true,
        chieu: {
          EN_VI: { nhom: 'TAM_NGUNG', trangThai: 'TAM_NGUNG' },
          VI_EN: { nhom: 'TAM_NGUNG', trangThai: 'TAM_NGUNG' }
        }
      }
    ];

    if (q) items = items.filter(i => i.tu.toLowerCase().includes(q) || i.nghiaVi.toLowerCase().includes(q));
    if (nhom) items = items.filter(i => i.chieu.EN_VI.nhom === nhom || i.chieu.VI_EN.nhom === nhom);

    const totalElements = items.length;
    const totalPages = Math.ceil(totalElements / size);
    
    return HttpResponse.json({
      ten: 'Bộ mẫu test tiến độ',
      muiGio: 'Asia/Ho_Chi_Minh',
      tongHop: {
        MOI: 1, DANG_HOC: 1, DEN_HAN: 1, QUA_HAN: 0, TAM_NGUNG: 1
      },
      items: items.slice(page * size, (page + 1) * size),
      totalElements, totalPages, page, size
    });
  }),

  // Suspend Card Progress
  http.put('*/api/v1/cards/:id/progress/suspend', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true, tamNgung: body.tamNgung });
  }),

  // Reset Card Progress
  http.post('*/api/v1/cards/:id/progress/reset', () => {
    return HttpResponse.json({ success: true });
  }),

  // Learning History
  http.get('*/api/v1/learning/history', ({ request }) => {
    const url = new URL(request.url);
    const theId = url.searchParams.get('theId');
    if (!theId) return HttpResponse.json({ items: [] });
    
    return HttpResponse.json({
      items: [
        {
          createdAt: new Date().toISOString(),
          chieuHoc: 'EN_VI',
          danhGia: 'NHO',
          truoc: { trangThai: 'MOI' },
          sau: { trangThai: 'ON_TAP' }
        },
        {
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          chieuHoc: 'VI_EN',
          danhGia: 'KHO',
          truoc: { trangThai: 'ON_TAP' },
          sau: { trangThai: 'HOC_LAI' }
        }
      ]
    });
  })
];
