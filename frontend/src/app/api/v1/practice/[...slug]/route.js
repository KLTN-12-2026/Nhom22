import { NextResponse } from 'next/server';
import { backendJson, jsonError, proxyOrMock } from '@/app/api/v1/_mock/backend';
import { mockStore, newId, recordMistake, visibleNotebook } from '@/app/api/v1/_mock/store';
import { CONFUSING_PAIRS, DEFAULT_CARDS, SKILL_OF } from '@/app/api/v1/_mock/seed';

const TYPES = [...Object.keys(SKILL_OF), 'TONG_HOP'];
const MIX = ['CHON_NGHIA', 'DIEN_CHO_TRONG', 'NGHE_VIET', 'CHON_TU', 'NHAP_TU_THEO_NGHIA'];
const ALL_DECKS = 'Tất cả bộ của tôi';
const NOTEBOOK = 'Sổ tay từ khó';

function shuffle(list) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const normalize = value => String(value || '').normalize('NFC').replace(/[’‘`]/g, "'").trim().replace(/\s+/g, ' ').toLowerCase();

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return dp[a.length][b.length];
}

function blankOf(card) {
  const sentence = card.viDuEn || '';
  const word = card.tu.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = sentence.match(new RegExp(`\\b(${word}[a-z]*)`, 'i'));
  if (!match) return null;
  return { cau: sentence.slice(0, match.index) + '_____' + sentence.slice(match.index + match[1].length), dapAn: match[1] };
}

const snapshot = card => ({ theId: card.id, tu: card.tu, phienAm: card.phienAm || null, tuLoai: card.tuLoai || null, nghiaVi: card.nghiaVi, viDuEn: card.viDuEn || null, dichVi: card.dichVi || null, boTheId: card.boTheId || null, boTheTen: card.boTheTen || null });
const explanation = snap => ({ tu: snap.tu, phienAm: snap.phienAm, tuLoai: snap.tuLoai, nghiaVi: snap.nghiaVi, viDuEn: snap.viDuEn, dichVi: snap.dichVi });

async function loadCards(req, deck) {
  const page = await backendJson(req, `/api/v1/decks/${encodeURIComponent(deck.id)}/cards?size=100`);
  return (page?.items || []).map(card => ({ ...card, boTheId: String(deck.id), boTheTen: deck.ten }));
}

async function loadPool(req, body, store) {
  if (body.nguon === 'SO_TAY') {
    return { name: NOTEBOOK, pool: visibleNotebook(store).map(item => ({ id: item.theId, tu: item.tu, tuLoai: item.tuLoai, phienAm: item.phienAm, nghiaVi: item.nghiaVi, boTheId: item.boTheId, boTheTen: item.boTheTen })) };
  }
  if (body.boTheId) {
    const deck = await backendJson(req, `/api/v1/decks/${encodeURIComponent(body.boTheId)}`);
    if (deck) return { name: deck.ten, pool: await loadCards(req, deck) };
    return { name: 'Bộ thẻ minh họa', pool: DEFAULT_CARDS };
  }
  const decks = await backendJson(req, '/api/v1/decks?size=100');
  const pool = (await Promise.all((decks?.items || []).slice(0, 10).map(deck => loadCards(req, deck)))).flat();
  return { name: ALL_DECKS, pool: pool.length >= 4 ? pool : DEFAULT_CARDS };
}

async function audioUrl(req, card) {
  if (!card.amTuId || !card.boTheId) return null;
  const file = await backendJson(req, `/api/v1/decks/${encodeURIComponent(card.boTheId)}/cards/${encodeURIComponent(card.id)}/files/AM_TU`);
  return file?.downloadUrl || null;
}

async function makeQuestion(req, type, card, distract, thuTu) {
  const base = { id: newId('q'), thuTu, loaiCau: type, theId: card.id, snap: snapshot(card) };
  if (type === 'CHON_NGHIA' || type === 'CHON_TU') {
    const others = shuffle(distract.filter(other => normalize(other.tu) !== normalize(card.tu) && normalize(other.nghiaVi) !== normalize(card.nghiaVi))).slice(0, 3);
    if (others.length < 3) return null;
    const options = shuffle([card, ...others]).map((item, i) => ({ id: `o${i + 1}`, noiDung: type === 'CHON_NGHIA' ? item.nghiaVi : item.tu, theId: item.id }));
    return {
      ...base,
      deBai: type === 'CHON_NGHIA' ? { tu: card.tu, phienAm: card.phienAm || null, tuLoai: card.tuLoai || null } : { nghiaVi: card.nghiaVi, tuLoai: card.tuLoai || null },
      phuongAn: options.map(({ id, noiDung }) => ({ id, noiDung })),
      options,
      answer: { luaChonId: options.find(option => option.theId === card.id).id, noiDung: type === 'CHON_NGHIA' ? card.nghiaVi : card.tu }
    };
  }
  if (type === 'DIEN_CHO_TRONG') {
    const blank = blankOf(card);
    if (!blank) return null;
    return { ...base, deBai: { cau: blank.cau, goiY: card.nghiaVi, tuLoai: card.tuLoai || null }, answer: { chapNhan: [blank.dapAn], noiDung: blank.dapAn } };
  }
  if (type === 'NHAP_TU_THEO_NGHIA') {
    return { ...base, deBai: { nghiaVi: card.nghiaVi, tuLoai: card.tuLoai || null, viDuVi: card.dichVi || null }, answer: { chapNhan: [card.tu], noiDung: card.tu } };
  }
  if (type === 'NGHE_VIET') {
    const url = await audioUrl(req, card);
    if (!url) return null;
    return { ...base, deBai: { amThanhUrl: url, tuLoai: card.tuLoai || null }, answer: { chapNhan: [card.tu], noiDung: card.tu } };
  }
  return null;
}

function matchQuestion(group, thuTu) {
  const left = shuffle(group).map((card, i) => ({ id: `t${i + 1}`, noiDung: card.tu, theId: card.id }));
  const right = shuffle(group).map((card, i) => ({ id: `n${i + 1}`, noiDung: card.nghiaVi, theId: card.id }));
  return {
    id: newId('q'), thuTu, loaiCau: 'GHEP_TU', theIds: group.map(card => card.id), cards: group.map(snapshot),
    deBai: { cotTrai: left.map(({ id, noiDung }) => ({ id, noiDung })), cotPhai: right.map(({ id, noiDung }) => ({ id, noiDung })) },
    left, right,
    answer: { cap: left.map(l => ({ traiId: l.id, phaiId: right.find(r => r.theId === l.theId).id })) }
  };
}

function pairQuestion(target, other, thuTu) {
  const blank = blankOf(target);
  const options = shuffle([target, other]).map((card, i) => ({ id: `o${i + 1}`, noiDung: card.tu, theId: card.id }));
  return {
    id: newId('q'), thuTu, loaiCau: 'PHAN_BIET_CAP', theId: target.id, snap: snapshot(target), other: explanation(snapshot(other)),
    deBai: blank ? { cau: blank.cau, goiY: null } : { cau: null, goiY: target.nghiaVi },
    phuongAn: options.map(({ id, noiDung }) => ({ id, noiDung })),
    options,
    answer: { luaChonId: options.find(option => option.theId === target.id).id, noiDung: blank ? blank.dapAn : target.tu }
  };
}

const publicQuestion = q => ({ id: q.id, thuTu: q.thuTu, loaiCau: q.loaiCau, deBai: q.deBai, phuongAn: q.phuongAn || null });

const attemptView = a => ({ lanLamId: a.lanLamId, baiLuyenId: a.baiLuyenId, loaiBai: a.loaiBai, boTheTen: a.boTheTen, soCauDung: a.soCauDung, tongSoCau: a.tongSoCau, diem: a.diem, thoiGianMs: a.thoiGianMs, nopAt: a.nopAt, laLuyenLai: a.laLuyenLai, theoKyNang: a.theoKyNang, ketQua: a.ketQua });

function practiceView(store, session) {
  const attempt = session.lanLamId ? store.attempts.find(a => a.lanLamId === session.lanLamId) : null;
  return {
    id: session.id, loaiBai: session.loaiBai, boTheId: session.boTheId, boTheTen: session.boTheTen, nguon: session.nguon,
    soCau: session.cauHoi.length, soCauYeuCau: session.soCauYeuCau, taoAt: session.taoAt, laLuyenLai: session.laLuyenLai,
    daNop: !!attempt, lanLamId: session.lanLamId, cauHoi: session.cauHoi.map(publicQuestion), ketQua: attempt ? attemptView(attempt) : null
  };
}

function pairCards(theIds) {
  return CONFUSING_PAIRS
    .filter(pair => !theIds?.length || (theIds.includes(pair.the1.id) && theIds.includes(pair.the2.id)))
    .map(pair => [pair.the1, pair.the2]);
}

async function createSession(req, store) {
  const body = await req.json().catch(() => ({}));
  const errors = [];
  if (!TYPES.includes(body.loaiBai)) errors.push({ field: 'loaiBai', message: 'Chọn dạng bài' });
  if (![5, 10, 20].includes(Number(body.soCau))) errors.push({ field: 'soCau', message: 'Chọn 5, 10 hoặc 20 câu' });
  if (errors.length) return jsonError(400, 'VALIDATION_FAILED', 'Dữ liệu không hợp lệ', errors);
  const n = Number(body.soCau);
  const theIds = Array.isArray(body.theIds) ? body.theIds.map(String) : [];
  const questions = [];
  let name = ALL_DECKS;

  if (body.loaiBai === 'PHAN_BIET_CAP') {
    const pairs = pairCards(theIds);
    if (!pairs.length) return jsonError(422, 'BUSINESS_RULE', 'Bạn chưa có cặp từ dễ nhầm. Cặp được ghi nhận khi bạn chọn nhầm giữa hai từ trong bài luyện.');
    shuffle(pairs).forEach(([a, b]) => [[a, b], [b, a]].forEach(([x, y]) => { if (questions.length < n) questions.push(pairQuestion(x, y, questions.length + 1)); }));
  } else {
    const loaded = await loadPool(req, body, store);
    name = loaded.name;
    const pool = theIds.length ? loaded.pool.filter(card => theIds.includes(String(card.id))) : loaded.pool;
    if (!pool.length) return jsonError(422, 'BUSINESS_RULE', body.nguon === 'SO_TAY' ? 'Sổ tay đang trống, chưa có từ nào để luyện.' : 'Chưa có thẻ nào để luyện. Thêm thẻ vào bộ trước.');
    const distract = [...loaded.pool, ...DEFAULT_CARDS.filter(card => !loaded.pool.some(item => normalize(item.tu) === normalize(card.tu)))];
    const order = shuffle(pool);
    if (body.loaiBai === 'GHEP_TU') {
      const chosen = order.slice(0, n);
      for (let i = 0; i < chosen.length; i += 5) {
        let group = chosen.slice(i, i + 5);
        if (group.length < 3) group = group.concat(shuffle(distract.filter(card => !group.some(item => normalize(item.tu) === normalize(card.tu)))).slice(0, 3 - group.length));
        questions.push(matchQuestion(group, questions.length + 1));
      }
    } else {
      const types = body.loaiBai === 'TONG_HOP' ? MIX : [body.loaiBai];
      for (let i = 0; i < order.length && questions.length < n; i++) {
        for (let k = 0; k < types.length; k++) {
          const question = await makeQuestion(req, types[(i + k) % types.length], order[i], distract, questions.length + 1);
          if (question) { questions.push(question); break; }
        }
      }
    }
  }
  if (!questions.length) {
    const message = body.loaiBai === 'DIEN_CHO_TRONG'
      ? 'Các thẻ đã chọn chưa có câu ví dụ chứa đúng từ, nên chưa tạo được câu điền chỗ trống.'
      : body.loaiBai === 'NGHE_VIET' ? 'Các thẻ đã chọn chưa có âm thanh phát âm, nên chưa tạo được câu nghe viết.' : 'Chưa tạo được câu hỏi từ các thẻ đã chọn.';
    return jsonError(422, 'BUSINESS_RULE', message);
  }
  const session = {
    id: newId('bai'), loaiBai: body.loaiBai, boTheId: body.boTheId ? String(body.boTheId) : null,
    boTheTen: body.loaiBai === 'PHAN_BIET_CAP' ? NOTEBOOK : name, nguon: body.nguon || 'BO_THE',
    soCauYeuCau: n, taoAt: new Date().toISOString(), laLuyenLai: false, lanLamId: null, cauHoi: questions
  };
  store.sessions.set(session.id, session);
  return NextResponse.json(practiceView(store, session), { status: 201 });
}

function grade(store, session, given, createdAt) {
  return session.cauHoi.map(q => {
    const reply = given[q.id] || {};
    let dung = false;
    let diem = 0;
    let nhomLoi = null;
    let traLoi;
    let giaiThich;
    if (q.loaiCau === 'GHEP_TU') {
      const pairs = Array.isArray(reply.cap) ? reply.cap : [];
      const chiTiet = q.answer.cap.map(correct => {
        const got = pairs.find(pair => pair.traiId === correct.traiId);
        const left = q.left.find(l => l.id === correct.traiId);
        const chosen = got ? q.right.find(r => r.id === got.phaiId) : null;
        return { traiId: correct.traiId, tu: left.noiDung, phaiIdDaChon: got?.phaiId || null, nghiaDaChon: chosen?.noiDung || null, nghiaDung: q.right.find(r => r.id === correct.phaiId).noiDung, dung: !!got && got.phaiId === correct.phaiId, theId: left.theId };
      });
      const good = chiTiet.filter(item => item.dung).length;
      diem = good / chiTiet.length;
      dung = good === chiTiet.length;
      nhomLoi = dung ? null : 'NGHIA';
      traLoi = { cap: pairs };
      giaiThich = { cap: chiTiet };
      chiTiet.filter(item => !item.dung).forEach(item => recordMistake(store, q.cards.find(card => card.theId === item.theId), { nhomLoi: 'NGHIA', traLoi: item.nghiaDaChon, dapAn: item.nghiaDung, baiLuyenId: session.id, createdAt }));
    } else if (q.phuongAn) {
      const chosen = q.options.find(option => option.id === reply.luaChonId);
      dung = reply.luaChonId === q.answer.luaChonId;
      if (!dung) nhomLoi = q.loaiCau === 'PHAN_BIET_CAP' ? 'CAP_NHAM' : 'NGHIA';
      traLoi = { luaChonId: reply.luaChonId || null, noiDung: chosen?.noiDung || null };
      const base = explanation(q.snap);
      giaiThich = q.other ? { ...base, soSanh: [{ tu: base.tu, nghiaVi: base.nghiaVi }, { tu: q.other.tu, nghiaVi: q.other.nghiaVi }] } : base;
    } else {
      const text = String(reply.noiDung || '').slice(0, 200);
      const got = normalize(text);
      traLoi = { noiDung: text };
      dung = !!got && q.answer.chapNhan.some(accepted => normalize(accepted) === got);
      if (!dung) {
        const near = got && editDistance(got, normalize(q.answer.noiDung)) <= 2;
        nhomLoi = near ? 'CHINH_TA' : q.loaiCau === 'NGHE_VIET' ? 'NGHE' : q.loaiCau === 'DIEN_CHO_TRONG' ? 'NGU_CANH' : 'NGHIA';
      }
      giaiThich = explanation(q.snap);
    }
    if (q.loaiCau !== 'GHEP_TU') {
      diem = dung ? 1 : 0;
      if (!dung) recordMistake(store, q.snap, { nhomLoi, traLoi: traLoi.noiDung, dapAn: q.answer.noiDung, baiLuyenId: session.id, createdAt });
    }
    return {
      cauHoiId: q.id, thuTu: q.thuTu, loaiCau: q.loaiCau, deBai: q.deBai, phuongAn: q.phuongAn || null, traLoi,
      dapAn: { luaChonId: q.answer.luaChonId || null, noiDung: q.answer.noiDung || null, cap: q.answer.cap || null },
      dung, diem, nhomLoi, giaiThich, theId: q.theId || null, theIds: q.theIds || null
    };
  });
}

async function submit(req, store, session) {
  const body = await req.json().catch(() => ({}));
  const existing = session.lanLamId ? store.attempts.find(a => a.lanLamId === session.lanLamId) : null;
  if (existing) {
    if (body.submitKey && body.submitKey === existing.submitKey) return NextResponse.json(attemptView(existing));
    return NextResponse.json({ code: 'CONFLICT', message: 'Bài này đã được nộp', lanLamId: existing.lanLamId }, { status: 409 });
  }
  if (!body.submitKey || !/^[A-Za-z0-9._:-]{1,128}$/.test(body.submitKey)) {
    return jsonError(400, 'VALIDATION_FAILED', 'Dữ liệu không hợp lệ', [{ field: 'submitKey', message: 'Thiếu mã nộp bài' }]);
  }
  const given = {};
  (Array.isArray(body.traLoi) ? body.traLoi : []).forEach(reply => { if (reply?.cauHoiId) given[reply.cauHoiId] = reply; });
  const lanLamId = newId('lan');
  const nopAt = new Date().toISOString();
  const ketQua = grade(store, session, given, nopAt);
  const bySkill = {};
  ketQua.forEach(item => {
    const kyNang = SKILL_OF[item.loaiCau];
    bySkill[kyNang] ??= { kyNang, dung: 0, tong: 0 };
    bySkill[kyNang].tong++;
    if (item.dung) bySkill[kyNang].dung++;
  });
  const soCauDung = ketQua.filter(item => item.dung).length;
  const attempt = {
    lanLamId, baiLuyenId: session.id, loaiBai: session.loaiBai, boTheId: session.boTheId, boTheTen: session.boTheTen,
    submitKey: body.submitKey, soCauDung, tongSoCau: ketQua.length,
    diem: Math.round(ketQua.reduce((sum, item) => sum + item.diem, 0) / ketQua.length * 100),
    thoiGianMs: Math.max(0, Math.min(Number(body.thoiGianMs) || 0, 3 * 3600000)), nopAt, laLuyenLai: session.laLuyenLai,
    theoKyNang: Object.values(bySkill), ketQua
  };
  store.attempts.push(attempt);
  session.lanLamId = lanLamId;
  return NextResponse.json(attemptView(attempt), { status: 201 });
}

async function retry(req, store) {
  const body = await req.json().catch(() => ({}));
  const previous = store.attempts.find(a => a.lanLamId === body.lanLamId);
  const source = previous && store.sessions.get(previous.baiLuyenId);
  if (!previous || !source) return jsonError(404, 'NOT_FOUND', 'Không tìm thấy bài làm cần luyện lại');
  const wrong = source.cauHoi.filter(q => previous.ketQua.some(item => item.cauHoiId === q.id && !item.dung));
  if (!wrong.length) return jsonError(422, 'BUSINESS_RULE', 'Bài này không có câu sai để luyện lại.');
  const session = {
    ...source, id: newId('bai'), taoAt: new Date().toISOString(), laLuyenLai: true, lanLamId: null,
    soCauYeuCau: wrong.length, cauHoi: wrong.map((q, i) => ({ ...q, id: newId('q'), thuTu: i + 1 }))
  };
  store.sessions.set(session.id, session);
  return NextResponse.json(practiceView(store, session), { status: 201 });
}

function history(req, store) {
  const params = req.nextUrl.searchParams;
  const page = Math.max(0, Number.parseInt(params.get('page') || '0', 10) || 0);
  const size = Math.min(100, Math.max(1, Number.parseInt(params.get('size') || '20', 10) || 20));
  const loaiBai = params.get('loaiBai') || '';
  const items = store.attempts
    .filter(a => !loaiBai || a.loaiBai === loaiBai)
    .slice()
    .reverse()
    .map(a => ({ lanLamId: a.lanLamId, baiLuyenId: a.baiLuyenId, loaiBai: a.loaiBai, laLuyenLai: a.laLuyenLai, boTheTen: a.boTheTen, nopAt: a.nopAt, thoiGianMs: a.thoiGianMs, soCauDung: a.soCauDung, soCauSai: a.tongSoCau - a.soCauDung, tongSoCau: a.tongSoCau, diem: a.diem }));
  return NextResponse.json({ items: items.slice(page * size, (page + 1) * size), page, size, totalElements: items.length, totalPages: Math.ceil(items.length / size) });
}

function mockGet(req, slug) {
  const store = mockStore(req);
  if (slug.length === 1 && slug[0] === 'history') return history(req, store);
  if (slug.length === 2 && slug[0] === 'sessions') {
    const session = store.sessions.get(slug[1]);
    return session ? NextResponse.json(practiceView(store, session)) : jsonError(404, 'NOT_FOUND', 'Không tìm thấy bài luyện');
  }
  return jsonError(404, 'NOT_FOUND', 'Không tìm thấy đường dẫn');
}

function mockPost(req, slug) {
  const store = mockStore(req);
  if (slug.length === 1 && slug[0] === 'sessions') return createSession(req, store);
  if (slug.length === 3 && slug[0] === 'sessions' && slug[2] === 'submissions') {
    const session = store.sessions.get(slug[1]);
    return session ? submit(req, store, session) : jsonError(404, 'NOT_FOUND', 'Không tìm thấy bài luyện');
  }
  if (slug.length === 2 && slug[0] === 'mistakes' && slug[1] === 'retry') return retry(req, store);
  return jsonError(404, 'NOT_FOUND', 'Không tìm thấy đường dẫn');
}

const pathOf = slug => `/api/v1/practice/${slug.map(encodeURIComponent).join('/')}`;

export async function GET(req, { params }) {
  const { slug = [] } = await params;
  return proxyOrMock(req, pathOf(slug), () => mockGet(req, slug));
}

export async function POST(req, { params }) {
  const { slug = [] } = await params;
  return proxyOrMock(req, pathOf(slug), () => mockPost(req, slug));
}
