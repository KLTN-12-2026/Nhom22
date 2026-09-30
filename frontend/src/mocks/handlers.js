import { http, HttpResponse } from 'msw';

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
];
