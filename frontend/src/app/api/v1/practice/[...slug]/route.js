'use strict';
import { NextResponse } from 'next/server';

// In-memory mock store for when BE practice endpoints are not yet deployed (Sprint 6)
if (!globalThis.__practiceSessions) {
  globalThis.__practiceSessions = new Map();
}
if (!globalThis.__practiceHistory) {
  globalThis.__practiceHistory = [];
}

const DEFAULT_CARDS = [
  { id: 'c1', tu: 'invoice', tuLoai: 'n', phienAm: '/ˈɪn.vɔɪs/', nghiaVi: 'hóa đơn', viDuEn: 'Please check the invoice before making payment.', dichVi: 'Vui lòng kiểm tra hóa đơn trước khi thanh toán.' },
  { id: 'c2', tu: 'schedule', tuLoai: 'n', phienAm: '/ˈskedʒ.uːl/', nghiaVi: 'lịch trình', viDuEn: 'The meeting schedule has been updated.', dichVi: 'Lịch trình cuộc họp đã được cập nhật.' },
  { id: 'c3', tu: 'contract', tuLoai: 'n', phienAm: '/ˈkɑːn.trækt/', nghiaVi: 'hợp đồng', viDuEn: 'They signed a two-year contract yesterday.', dichVi: 'Họ đã ký hợp đồng hai năm vào hôm qua.' },
  { id: 'c4', tu: 'confirm', tuLoai: 'v', phienAm: '/kənˈfɝːm/', nghiaVi: 'xác nhận', viDuEn: 'Please confirm your attendance by Friday.', dichVi: 'Vui lòng xác nhận sự tham gia trước thứ Sáu.' },
  { id: 'c5', tu: 'negotiate', tuLoai: 'v', phienAm: '/nəˈɡoʊ.ʃi.eɪt/', nghiaVi: 'đàm phán, thương lượng', viDuEn: 'We need to negotiate a better price.', dichVi: 'Chúng ta cần đàm phán để có mức giá tốt hơn.' },
  { id: 'c6', tu: 'applicant', tuLoai: 'n', phienAm: '/ˈæp.lə.kənt/', nghiaVi: 'người nộp đơn, ứng viên', viDuEn: 'Each applicant must submit a resume.', dichVi: 'Mỗi ứng viên phải nộp một bản sơ yếu lý lịch.' },
  { id: 'c7', tu: 'budget', tuLoai: 'n', phienAm: '/ˈbʌdʒ.ɪt/', nghiaVi: 'ngân sách', viDuEn: 'The project exceeded its allocated budget.', dichVi: 'Dự án đã vượt quá ngân sách được phân bổ.' },
  { id: 'c8', tu: 'deadline', tuLoai: 'n', phienAm: '/ˈded.laɪn/', nghiaVi: 'hạn chót', viDuEn: 'The deadline for submission is 5 PM tomorrow.', dichVi: 'Hạn chót nộp bài là 5 giờ chiều ngày mai.' },
  { id: 'c9', tu: 'feedback', tuLoai: 'n', phienAm: '/ˈfiːd.bæk/', nghiaVi: 'phản hồi, ý kiến đóng góp', viDuEn: 'Customer feedback helps improve product quality.', dichVi: 'Phản hồi của khách hàng giúp cải thiện chất lượng sản phẩm.' },
  { id: 'c10', tu: 'promotion', tuLoai: 'n', phienAm: '/prəˈmoʊ.ʃən/', nghiaVi: 'thăng tiến, khuyến mãi', viDuEn: 'She earned a promotion after exceptional performance.', dichVi: 'Cô ấy được thăng chức sau thành tích xuất sắc.' }
];

const SKILL_MAP = {
  CHON_NGHIA: 'Nhận nghĩa',
  CHON_TU: 'Nhận nghĩa',
  GHEP_TU: 'Nhận nghĩa',
  DIEN_CHO_TRONG: 'Dùng từ trong câu',
  NHAP_TU_THEO_NGHIA: 'Viết đúng chính tả',
  NGHE_VIET: 'Nghe và viết',
  PHAN_BIET_CAP: 'Phân biệt cặp dễ nhầm',
  TONG_HOP: 'Nhiều kỹ năng'
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function tryProxyToBackend(req, slug) {
  const beBase = (process.env.API_URL || 'http://localhost:8080').replace(/\/$/, '');
  const url = `${beBase}/api/v1/practice/${slug.join('/')}${req.nextUrl.search}`;
  try {
    const headers = new Headers();
    const cookie = req.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);
    const contentType = req.headers.get('content-type');
    if (contentType) headers.set('content-type', contentType);
    const xsrf = req.headers.get('x-xsrf-token');
    if (xsrf) headers.set('x-xsrf-token', xsrf);

    const init = {
      method: req.method,
      headers,
    };
    if (!['GET', 'HEAD'].includes(req.method)) {
      const bodyText = await req.clone().text();
      if (bodyText) init.body = bodyText;
    }
    const beRes = await fetch(url, init);
    // If backend implemented it (not 404, not 502, not 503)
    if (beRes.status !== 404 && beRes.status !== 502 && beRes.status !== 503) {
      const resBody = await beRes.text();
      return new NextResponse(resBody, {
        status: beRes.status,
        headers: {
          'content-type': beRes.headers.get('content-type') || 'application/json'
        }
      });
    }
  } catch (e) {
    // Backend unreachable or not implemented, continue to local practice handler
  }
  return null;
}

export async function GET(req, { params }) {
  const { slug = [] } = await params;
  const proxy = await tryProxyToBackend(req, slug);
  if (proxy) return proxy;

  // 1. GET /api/v1/practice/history
  if (slug.length === 1 && slug[0] === 'history') {
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '0', 10);
    const size = parseInt(searchParams.get('size') || '10', 10);
    const loaiBai = searchParams.get('loaiBai') || '';

    let items = globalThis.__practiceHistory.slice().reverse();
    if (loaiBai) {
      items = items.filter(a => a.loaiBai === loaiBai);
    }
    const totalElements = items.length;
    const totalPages = Math.ceil(totalElements / size) || 1;
    const pagedItems = items.slice(page * size, (page + 1) * size);

    return NextResponse.json({
      items: pagedItems,
      page,
      size,
      totalElements,
      totalPages
    });
  }

  // 2. GET /api/v1/practice/sessions/[id]
  if (slug.length === 2 && slug[0] === 'sessions') {
    const id = slug[1];
    const session = globalThis.__practiceSessions.get(id);
    if (!session) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Không tìm thấy phiên luyện tập' }, { status: 404 });
    }

    // If already submitted, include result
    if (session.daNop && session.lanLamId) {
      const attempt = globalThis.__practiceHistory.find(h => h.lanLamId === session.lanLamId);
      return NextResponse.json({
        ...session,
        ketQua: attempt || session.ketQua
      });
    }

    // Otherwise return questions for taking exam (remove sensitive answers for security)
    const safeCauHoi = session.cauHoi.map(q => {
      const { dapAnDung, ...safeQ } = q;
      return safeQ;
    });

    return NextResponse.json({
      id: session.id,
      loaiBai: session.loaiBai,
      boTheId: session.boTheId,
      boTheTen: session.boTheTen,
      soCau: safeCauHoi.length,
      soCauYeuCau: session.soCauYeuCau,
      taoAt: session.taoAt,
      laLuyenLai: session.laLuyenLai,
      daNop: false,
      cauHoi: safeCauHoi
    });
  }

  return NextResponse.json({ code: 'NOT_FOUND', message: 'API not found' }, { status: 404 });
}

export async function POST(req, { params }) {
  const { slug = [] } = await params;
  const proxy = await tryProxyToBackend(req, slug);
  if (proxy) return proxy;

  // 1. POST /api/v1/practice/sessions
  if (slug.length === 1 && slug[0] === 'sessions') {
    const body = await req.json().catch(() => ({}));
    const loaiBai = body.loaiBai || 'CHON_NGHIA';
    const soCau = [5, 10, 20].includes(Number(body.soCau)) ? Number(body.soCau) : 10;
    const boTheId = body.boTheId || null;

    let pool = [...DEFAULT_CARDS];
    let boTheTen = 'Tất cả bộ của tôi';

    // If user selected a specific deck, try to fetch cards from backend
    if (boTheId) {
      try {
        const beBase = (process.env.API_URL || 'http://localhost:8080').replace(/\/$/, '');
        const cookie = req.headers.get('cookie') || '';
        const cardsRes = await fetch(`${beBase}/api/v1/decks/${boTheId}/cards?size=100`, {
          headers: { cookie }
        });
        if (cardsRes.ok) {
          const cardsData = await cardsRes.json();
          if (cardsData.items && cardsData.items.length >= 2) {
            pool = cardsData.items.map(c => ({
              id: c.id,
              tu: c.tu,
              tuLoai: c.tuLoai || 'n',
              phienAm: c.phienAm || '',
              nghiaVi: c.nghiaVi,
              viDuEn: c.viDuEn || `This is an example for ${c.tu}.`,
              dichVi: c.dichVi || ''
            }));
          }
        }
        const deckRes = await fetch(`${beBase}/api/v1/decks/${boTheId}`, {
          headers: { cookie }
        });
        if (deckRes.ok) {
          const deckData = await deckRes.json();
          if (deckData.ten) boTheTen = deckData.ten;
        }
      } catch (err) {
        // Fallback to default cards
      }
    }

    const availablePool = shuffle(pool);
    const chosenCards = availablePool.slice(0, Math.min(soCau, availablePool.length));

    const cauHoi = chosenCards.map((card, idx) => {
      const qId = `q_${idx + 1}_${card.id}`;
      const currentType = loaiBai === 'TONG_HOP'
        ? ['CHON_NGHIA', 'CHON_TU', 'DIEN_CHO_TRONG', 'NHAP_TU_THEO_NGHIA'][idx % 4]
        : loaiBai;

      // Distractors from other cards
      const otherCards = pool.filter(c => c.id !== card.id);
      const distractors = shuffle(otherCards).slice(0, 3);

      if (currentType === 'CHON_NGHIA') {
        const options = shuffle([
          { id: 'opt_correct', noiDung: card.nghiaVi },
          ...distractors.map((d, i) => ({ id: `opt_${i}`, noiDung: d.nghiaVi }))
        ]);
        return {
          id: qId,
          theId: card.id,
          loaiCau: 'CHON_NGHIA',
          deBai: { tu: card.tu, phienAm: card.phienAm, tuLoai: card.tuLoai },
          phuongAn: options,
          dapAnDung: 'opt_correct',
          dapAnNoiDung: card.nghiaVi,
          giaiThich: { tu: card.tu, phienAm: card.phienAm, nghiaVi: card.nghiaVi }
        };
      }

      if (currentType === 'CHON_TU' || currentType === 'PHAN_BIET_CAP') {
        const options = shuffle([
          { id: 'opt_correct', noiDung: card.tu },
          ...distractors.map((d, i) => ({ id: `opt_${i}`, noiDung: d.tu }))
        ]);
        return {
          id: qId,
          theId: card.id,
          loaiCau: currentType,
          deBai: { nghiaVi: card.nghiaVi, tuLoai: card.tuLoai },
          phuongAn: options,
          dapAnDung: 'opt_correct',
          dapAnNoiDung: card.tu,
          giaiThich: { tu: card.tu, phienAm: card.phienAm, nghiaVi: card.nghiaVi }
        };
      }

      if (currentType === 'DIEN_CHO_TRONG') {
        const regex = new RegExp(`\\b${card.tu}\\b`, 'gi');
        const sentence = (card.viDuEn || `We need to _____ immediately.`).replace(regex, '_____');
        return {
          id: qId,
          theId: card.id,
          loaiCau: 'DIEN_CHO_TRONG',
          deBai: { cau: sentence.includes('_____') ? sentence : `_____: ${card.viDuEn}`, goiY: card.nghiaVi, tuLoai: card.tuLoai },
          dapAnDung: card.tu.toLowerCase().trim(),
          dapAnNoiDung: card.tu,
          giaiThich: { tu: card.tu, phienAm: card.phienAm, nghiaVi: card.nghiaVi }
        };
      }

      if (currentType === 'GHEP_TU') {
        const pairCards = [card, ...distractors.slice(0, 3)];
        const cotTrai = pairCards.map(c => ({ id: `left_${c.id}`, noiDung: c.tu }));
        const cotPhai = shuffle(pairCards.map(c => ({ id: `right_${c.id}`, noiDung: c.nghiaVi })));
        return {
          id: qId,
          theId: card.id,
          loaiCau: 'GHEP_TU',
          deBai: { cotTrai, cotPhai },
          dapAnDung: pairCards.map(c => ({ traiId: `left_${c.id}`, phaiId: `right_${c.id}` })),
          dapAnNoiDung: pairCards.map(c => `${c.tu} = ${c.nghiaVi}`).join(', '),
          giaiThich: { tu: card.tu, phienAm: card.phienAm, nghiaVi: card.nghiaVi }
        };
      }

      // Default to NHAP_TU_THEO_NGHIA or NGHE_VIET
      return {
        id: qId,
        theId: card.id,
        loaiCau: currentType,
        deBai: {
          nghiaVi: card.nghiaVi,
          tuLoai: card.tuLoai,
          phienAm: card.phienAm,
          goiY: currentType === 'NGHE_VIET' ? 'Nghe phát âm hoặc dựa vào phiên âm' : 'Nhập từ tiếng Anh tương ứng'
        },
        dapAnDung: card.tu.toLowerCase().trim(),
        dapAnNoiDung: card.tu,
        giaiThich: { tu: card.tu, phienAm: card.phienAm, nghiaVi: card.nghiaVi }
      };
    });

    const sessionId = 'ses_' + Date.now();
    const session = {
      id: sessionId,
      loaiBai,
      boTheId,
      boTheTen,
      soCau: cauHoi.length,
      soCauYeuCau: soCau,
      taoAt: new Date().toISOString(),
      laLuyenLai: false,
      daNop: false,
      cauHoi
    };

    globalThis.__practiceSessions.set(sessionId, session);

    return NextResponse.json({
      id: sessionId,
      loaiBai,
      boTheId,
      boTheTen,
      soCau: cauHoi.length,
      soCauYeuCau: soCau,
      taoAt: session.taoAt,
      laLuyenLai: false,
      daNop: false
    }, { status: 201 });
  }

  // 2. POST /api/v1/practice/sessions/[id]/submissions
  if (slug.length === 3 && slug[0] === 'sessions' && slug[2] === 'submissions') {
    const id = slug[1];
    const session = globalThis.__practiceSessions.get(id);
    if (!session) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Không tìm thấy phiên luyện tập' }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const traLoiList = Array.isArray(body.traLoi) ? body.traLoi : [];
    const thoiGianMs = Number(body.thoiGianMs) || 60000;

    let soCauDung = 0;
    const ketQuaChiTiet = session.cauHoi.map((q, idx) => {
      const userAns = traLoiList.find(t => t.cauHoiId === q.id);
      let isCorrect = false;
      let userDisplay = '';

      if (q.loaiCau === 'GHEP_TU') {
        const userPairs = userAns?.cap || [];
        const correctPairs = q.dapAnDung || [];
        isCorrect = correctPairs.length > 0 && correctPairs.every(cp => {
          return userPairs.some(up => up.traiId === cp.traiId && up.phaiId === cp.phaiId);
        });
        userDisplay = isCorrect ? 'Đã ghép đúng tất cả' : 'Ghép chưa chính xác';
      } else if (q.phuongAn) {
        isCorrect = userAns?.luaChonId === q.dapAnDung;
        const chosenOpt = q.phuongAn.find(o => o.id === userAns?.luaChonId);
        userDisplay = chosenOpt ? chosenOpt.noiDung : '';
      } else {
        const val = String(userAns?.noiDung || '').trim().toLowerCase();
        isCorrect = val.length > 0 && val === String(q.dapAnDung).trim().toLowerCase();
        userDisplay = userAns?.noiDung || '';
      }

      if (isCorrect) soCauDung++;

      return {
        thuTu: idx + 1,
        cauHoiId: q.id,
        theId: q.theId,
        loaiCau: q.loaiCau,
        deBai: q.deBai,
        dung: isCorrect,
        nhomLoi: isCorrect ? null : (q.loaiCau === 'NHAP_TU_THEO_NGHIA' || q.loaiCau === 'NGHE_VIET' ? 'Chính tả' : 'Nghĩa'),
        traLoi: { noiDung: userDisplay },
        dapAn: { noiDung: q.dapAnNoiDung },
        giaiThich: q.giaiThich
      };
    });

    const tongSoCau = session.cauHoi.length;
    const diem = tongSoCau ? Math.round((soCauDung / tongSoCau) * 100) : 0;
    const lanLamId = 'lan_' + Date.now();
    const nopAt = new Date().toISOString();

    // Skill breakdown
    const skills = {};
    ketQuaChiTiet.forEach(item => {
      const skillName = SKILL_MAP[item.loaiCau] || 'Nhận nghĩa';
      if (!skills[skillName]) skills[skillName] = { dung: 0, tong: 0 };
      skills[skillName].tong++;
      if (item.dung) skills[skillName].dung++;
    });
    const theoKyNang = Object.entries(skills).map(([kyNang, stat]) => ({
      kyNang,
      dung: stat.dung,
      tong: stat.tong
    }));

    const attempt = {
      lanLamId,
      baiLuyenId: session.id,
      loaiBai: session.loaiBai,
      boTheTen: session.boTheTen,
      soCauDung,
      tongSoCau,
      soCauSai: tongSoCau - soCauDung,
      diem,
      thoiGianMs,
      nopAt,
      laLuyenLai: session.laLuyenLai,
      theoKyNang,
      ketQua: ketQuaChiTiet
    };

    session.daNop = true;
    session.lanLamId = lanLamId;
    session.ketQua = attempt;

    globalThis.__practiceHistory.push(attempt);

    return NextResponse.json(attempt, { status: 201 });
  }

  // 3. POST /api/v1/practice/mistakes/retry
  if (slug.length === 2 && slug[0] === 'mistakes' && slug[1] === 'retry') {
    const body = await req.json().catch(() => ({}));
    const lanLamId = body.lanLamId;
    const prevAttempt = globalThis.__practiceHistory.find(h => h.lanLamId === lanLamId);
    if (!prevAttempt) {
      return NextResponse.json({ code: 'NOT_FOUND', message: 'Không tìm thấy bài làm cần luyện lại' }, { status: 404 });
    }

    const prevSession = globalThis.__practiceSessions.get(prevAttempt.baiLuyenId);
    const wrongQuestions = (prevSession?.cauHoi || []).filter(q => {
      const res = prevAttempt.ketQua.find(k => k.cauHoiId === q.id);
      return res && !res.dung;
    });

    const newId = 'ses_retry_' + Date.now();
    const newSession = {
      id: newId,
      loaiBai: prevAttempt.loaiBai,
      boTheId: prevSession?.boTheId || null,
      boTheTen: prevAttempt.boTheTen,
      soCau: wrongQuestions.length,
      soCauYeuCau: wrongQuestions.length,
      taoAt: new Date().toISOString(),
      laLuyenLai: true,
      daNop: false,
      cauHoi: wrongQuestions
    };

    globalThis.__practiceSessions.set(newId, newSession);

    return NextResponse.json({
      id: newId,
      loaiBai: newSession.loaiBai,
      boTheId: newSession.boTheId,
      boTheTen: newSession.boTheTen,
      soCau: wrongQuestions.length,
      soCauYeuCau: wrongQuestions.length,
      taoAt: newSession.taoAt,
      laLuyenLai: true,
      daNop: false
    }, { status: 201 });
  }

  return NextResponse.json({ code: 'NOT_FOUND', message: 'API not found' }, { status: 404 });
}
