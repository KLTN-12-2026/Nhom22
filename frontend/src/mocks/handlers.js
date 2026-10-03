let mockSessionStatus = 'DANG_HOC';
let mockPracticeStatus = 'DANG_LAM';

export const handlers = [
  // Ping
  http.get('*/api/v1/public/ping', () => {
    return HttpResponse.json({ message: 'pong from msw' });
  }),
  
  // Auth
  http.post('*/api/v1/auth/login', () => {
    return HttpResponse.json({ message: 'Login success' });
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
  })
];
