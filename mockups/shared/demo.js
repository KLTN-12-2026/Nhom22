(function () {
  const KEY = "vl-demo-v2";
  const SESSION = "vl-demo-session";
  const DEMO_PASSWORD = "Hoctap@2026";

  const TOPICS = [
    { id: "1", name: "Văn phòng & công sở", slug: "van-phong" },
    { id: "2", name: "Tài chính & kế toán", slug: "tai-chinh" },
    { id: "3", name: "Du lịch & sân bay", slug: "du-lich" },
    { id: "4", name: "Nhà hàng & khách sạn", slug: "nha-hang" },
    { id: "5", name: "Mua sắm & dịch vụ", slug: "mua-sam" },
    { id: "6", name: "Tuyển dụng & phỏng vấn", slug: "tuyen-dung" },
    { id: "7", name: "Giao tiếp hằng ngày", slug: "giao-tiep" },
    { id: "8", name: "Hợp đồng & pháp lý", slug: "hop-dong" }
  ];

  const TAGS = [
    { id: "1", name: "Part 5" },
    { id: "2", name: "Part 7" },
    { id: "3", name: "Cụm động từ" },
    { id: "4", name: "Collocation" },
    { id: "5", name: "Từ dễ nhầm" },
    { id: "6", name: "Thành ngữ" }
  ];

  const c = (word, pos, ipa, meaningVi, exampleEn, exampleVi, extra) =>
    Object.assign({ word, pos, ipa, meaningVi, exampleEn, exampleVi, difficulty: 2, tagIds: [], imageUrl: null, audioUrl: null }, extra || {});

  const OFFICE = [
    c("invoice", "n.", "/ˈɪnvɔɪs/", "hóa đơn (yêu cầu thanh toán)", "Please send the invoice to our accounts department.", "Vui lòng gửi hóa đơn cho phòng kế toán của chúng tôi.", { tagIds: ["1"] }),
    c("receipt", "n.", "/rɪˈsiːt/", "biên lai, giấy biên nhận", "Keep the receipt in case you need a refund.", "Giữ lại biên lai phòng khi bạn cần hoàn tiền.", { tagIds: ["1", "5"], difficulty: 3 }),
    c("reimburse", "v.", "/ˌriːɪmˈbɜːrs/", "hoàn trả (chi phí đã bỏ ra)", "The company will reimburse your travel expenses.", "Công ty sẽ hoàn trả chi phí đi lại của bạn.", { difficulty: 3 }),
    c("itinerary", "n.", "/aɪˈtɪnəreri/", "lịch trình chuyến đi", "Your itinerary includes a stop in Singapore.", "Lịch trình của bạn có một điểm dừng ở Singapore."),
    c("postpone", "v.", "/poʊstˈpoʊn/", "hoãn lại", "The meeting has been postponed until Friday.", "Cuộc họp đã được hoãn đến thứ Sáu.", { tagIds: ["1"] }),
    c("supervisor", "n.", "/ˈsuːpərvaɪzər/", "người giám sát, quản lý trực tiếp", "Ask your supervisor to approve the request.", "Hãy nhờ quản lý trực tiếp duyệt yêu cầu."),
    c("take over", "phr. v.", "/teɪk ˈoʊvər/", "tiếp quản, đảm nhận thay", "Ms. Tran will take over the project next month.", "Chị Trần sẽ tiếp quản dự án vào tháng sau.", { tagIds: ["3"] }),
    c("complimentary", "adj.", "/ˌkɑːmplɪˈmentri/", "miễn phí (tặng kèm); khác với complementary là “bổ sung”", "Guests receive a complimentary breakfast.", "Khách được tặng bữa sáng miễn phí.", { tagIds: ["5"], difficulty: 3 }),
    c("quarterly", "adj.", "/ˈkwɔːrtərli/", "hằng quý", "The quarterly report is due next week.", "Báo cáo quý phải nộp vào tuần sau."),
    c("shipment", "n.", "/ˈʃɪpmənt/", "lô hàng, việc giao hàng", "The shipment arrived two days late.", "Lô hàng đến trễ hai ngày.")
  ];

  const DAILY = [
    c("How's it going?", "phr.", "/haʊz ɪt ˈɡoʊɪŋ/", "Dạo này thế nào? (chào hỏi thân mật)", "Hey Minh, how's it going?", "Chào Minh, dạo này thế nào?", { difficulty: 1 }),
    c("I'm running late", "phr.", "/aɪm ˈrʌnɪŋ leɪt/", "Tôi đang bị trễ", "Sorry, I'm running late. I'll be there in ten minutes.", "Xin lỗi, mình đang bị trễ. Mười phút nữa mình tới.", { difficulty: 1 }),
    c("get along with", "phr. v.", "/ɡet əˈlɔːŋ wɪð/", "hòa hợp với ai", "She gets along with everyone on the team.", "Cô ấy hòa hợp với mọi người trong nhóm.", { tagIds: ["3"] }),
    c("run out of", "phr. v.", "/rʌn aʊt əv/", "hết, cạn (thứ gì)", "We've run out of printer paper.", "Chúng ta hết giấy in rồi.", { tagIds: ["3"] }),
    c("appreciate", "v.", "/əˈpriːʃieɪt/", "trân trọng, biết ơn", "I really appreciate your help.", "Mình thật sự cảm ơn bạn đã giúp.")
  ];

  const TRAVEL = [
    c("boarding pass", "n.", "/ˈbɔːrdɪŋ pæs/", "thẻ lên máy bay", "Please show your boarding pass at the gate.", "Vui lòng xuất trình thẻ lên máy bay tại cửa."),
    c("layover", "n.", "/ˈleɪoʊvər/", "chặng dừng nối chuyến", "We have a three-hour layover in Doha.", "Chúng tôi dừng nối chuyến ba tiếng ở Doha."),
    c("check in", "phr. v.", "/tʃek ɪn/", "làm thủ tục (nhận phòng, lên máy bay)", "You can check in online 24 hours before departure.", "Bạn có thể làm thủ tục trực tuyến 24 giờ trước giờ bay.", { tagIds: ["3"] })
  ];

  const HR = [
    c("applicant", "n.", "/ˈæplɪkənt/", "người nộp đơn, ứng viên", "Each applicant must submit a résumé.", "Mỗi ứng viên phải nộp sơ yếu lý lịch."),
    c("qualified", "adj.", "/ˈkwɑːlɪfaɪd/", "đủ năng lực, đủ tiêu chuẩn", "We are looking for a qualified accountant.", "Chúng tôi đang tìm một kế toán đủ năng lực."),
    c("uncharacteristically", "adv.", "/ˌʌnˌkærəktəˈrɪstɪkli/", "một cách khác thường (không giống tính cách thường ngày của ai đó); thường dùng khi mô tả hành vi bất ngờ của một người vốn rất ổn định", "He was uncharacteristically quiet during the interview.", "Anh ấy im lặng một cách khác thường trong buổi phỏng vấn.", { difficulty: 3 })
  ];

  const now = Date.now();
  const days = (n) => new Date(now - n * 86400000).toISOString();

  function seed() {
    let cardId = 100;
    const cards = [];
    const addCards = (deckId, list) => list.forEach((x) => cards.push(Object.assign({ id: String(++cardId), deckId, version: 0, createdAt: days(10) }, x)));

    const decks = [
      { id: "11", name: "TOEIC văn phòng — 600 từ nền tảng", description: "Từ vựng xuất hiện nhiều trong email, thông báo và hóa đơn của đề TOEIC Part 5–7. Mỗi thẻ có ví dụ đặt trong ngữ cảnh công sở.", goal: "TOEIC", topicId: "1", level: "CO_BAN", visibility: "CONG_KHAI", kind: "MAU", ownerId: "0", ownerName: "Nhóm biên soạn VocabLearning", source: "Tự biên soạn, đối chiếu từ điển Oxford Learner's", updatedAt: days(3), sourceDeckId: null },
      { id: "12", name: "Giao tiếp hằng ngày cho người mới", description: "Câu chào hỏi, xin lỗi, hẹn gặp và nhờ giúp đỡ — nói được ngay trong tuần đầu.", goal: "GIAO_TIEP", topicId: "7", level: "MOI_BAT_DAU", visibility: "CONG_KHAI", kind: "MAU", ownerId: "0", ownerName: "Nhóm biên soạn VocabLearning", source: "Tự biên soạn", updatedAt: days(5), sourceDeckId: null },
      { id: "13", name: "Sân bay và khách sạn", description: "Từ cần dùng khi làm thủ tục, nối chuyến và nhận phòng.", goal: "GIAO_TIEP", topicId: "3", level: "CO_BAN", visibility: "CONG_KHAI", kind: "MAU", ownerId: "0", ownerName: "Nhóm biên soạn VocabLearning", source: "Tự biên soạn", updatedAt: days(9), sourceDeckId: null },
      { id: "14", name: "Tuyển dụng & phỏng vấn (TOEIC Part 7)", description: "Mô tả công việc, yêu cầu ứng viên và lịch phỏng vấn.", goal: "TOEIC", topicId: "6", level: "TRUNG_CAP", visibility: "CONG_KHAI", kind: "MAU", ownerId: "0", ownerName: "Nhóm biên soạn VocabLearning", source: "Tự biên soạn", updatedAt: days(12), sourceDeckId: null },
      { id: "15", name: "Tổng hợp những cặp từ dễ nhầm trong TOEIC mà mình đã sai khi luyện đề suốt ba tháng ôn thi, kèm ví dụ và mẹo phân biệt ngắn gọn cho từng cặp", description: "Bộ mình tự làm khi ôn thi, chia sẻ cho ai cần: complimentary/complementary, affect/effect, receipt/recipe…", goal: "TOEIC", topicId: "1", level: "TRUNG_CAP", visibility: "CONG_KHAI", kind: "CHIA_SE", ownerId: "3", ownerName: "Lê Bình", source: "Người học chia sẻ", updatedAt: days(1), sourceDeckId: null },
      { id: "16", name: "Tài chính cơ bản", description: "Doanh thu, chi phí, ngân sách và báo cáo quý.", goal: "TOEIC", topicId: "2", level: "TRUNG_CAP", visibility: "CONG_KHAI", kind: "MAU", ownerId: "0", ownerName: "Nhóm biên soạn VocabLearning", source: "Tự biên soạn", updatedAt: days(20), sourceDeckId: null },
      { id: "17", name: "Gọi món và thanh toán", description: "Đặt bàn, gọi món, hỏi hóa đơn và tiền tip.", goal: "GIAO_TIEP", topicId: "4", level: "MOI_BAT_DAU", visibility: "CONG_KHAI", kind: "CHIA_SE", ownerId: "4", ownerName: "Phạm Chi", source: "Người học chia sẻ", updatedAt: days(7), sourceDeckId: null },
      { id: "21", name: "TOEIC Part 5 — từ hay sai của mình", description: "Chép lại từ các câu làm sai trong đề thử.", goal: "TOEIC", topicId: "1", level: "CO_BAN", visibility: "RIENG_TU", kind: "CA_NHAN", ownerId: "2", ownerName: "Nguyễn An", source: "Tự tạo", updatedAt: days(0), sourceDeckId: null },
      { id: "22", name: "Giao tiếp hằng ngày cho người mới", description: "Bản sao để tự thêm câu của mình.", goal: "GIAO_TIEP", topicId: "7", level: "MOI_BAT_DAU", visibility: "RIENG_TU", kind: "CA_NHAN", ownerId: "2", ownerName: "Nguyễn An", source: "Sao chép từ thư viện", updatedAt: days(2), sourceDeckId: "12" }
    ];
    decks.forEach((d) => { d.version = 0; d.createdAt = d.updatedAt; });

    addCards("11", OFFICE);
    addCards("12", DAILY);
    addCards("13", TRAVEL);
    addCards("14", HR);
    addCards("15", [OFFICE[1], OFFICE[7]].map((x) => Object.assign({}, x)));
    addCards("16", [OFFICE[8], OFFICE[0]].map((x) => Object.assign({}, x)));
    addCards("17", [DAILY[4]].map((x) => Object.assign({}, x)));
    addCards("21", [OFFICE[1], OFFICE[4], OFFICE[7], HR[2]].map((x) => Object.assign({}, x)));
    addCards("22", DAILY.map((x) => Object.assign({}, x)));

    const users = [
      { id: "1", email: "admin@vocab.local", tenHienThi: "Quản trị viên", trangThai: "HOAT_DONG", vaiTro: ["ADMIN", "USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "2", email: "an@vocab.local", tenHienThi: "Nguyễn An", trangThai: "HOAT_DONG", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "3", email: "binh@vocab.local", tenHienThi: "Lê Bình", trangThai: "HOAT_DONG", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "4", email: "chi@vocab.local", tenHienThi: "Phạm Chi", trangThai: "CHUA_XAC_THUC", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD }
    ];

    const learning = {
      "2": { goal: "TOEIC", level: "CO_BAN", topicIds: ["1", "2"], minutesPerDay: 15, newCardsPerDay: 10, onboardingDone: true, version: 0 }
    };
    const notify = {
      "2": { inApp: true, email: true, studyReminder: true, reminderTime: "20:30", version: 0 }
    };

    return { users, decks, cards, topics: TOPICS.slice(), tags: TAGS.slice(), learning, notify, favorites: { "2": ["11"] }, tokens: {}, files: {}, imports: {}, idem: {}, seq: 500, fails: {} };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const s = seed();
    save(s);
    return s;
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  let db = load();
  if (!db.learning["1"]) { db.learning["1"] = { goal: "GIAO_TIEP", level: "NANG_CAO", topicIds: [], minutesPerDay: 10, newCardsPerDay: 5, onboardingDone: true, version: 0 }; save(db); }

  const session = {
    get() { try { return JSON.parse(sessionStorage.getItem(SESSION) || localStorage.getItem(SESSION) || "null"); } catch (e) { return null; } },
    set(v, remember) { const s = JSON.stringify(v); sessionStorage.setItem(SESSION, s); if (remember) localStorage.setItem(SESSION, s); },
    clear() { sessionStorage.removeItem(SESSION); localStorage.removeItem(SESSION); }
  };

  const rid = () => "req-" + Math.random().toString(16).slice(2, 10);
  const nextId = () => String(++db.seq);

  class ApiError extends Error {
    constructor(status, code, message, fieldErrors, extra) {
      super(message);
      this.status = status; this.code = code; this.fieldErrors = fieldErrors || []; this.requestId = rid();
      Object.assign(this, extra || {});
    }
  }
  const fe = (field, message) => ({ field, message });
  const bad = (errors) => { throw new ApiError(400, "VALIDATION_FAILED", "Dữ liệu không hợp lệ", errors); };
  const notFound = () => { throw new ApiError(404, "NOT_FOUND", "Không tìm thấy nội dung bạn yêu cầu"); };
  const unauth = () => { throw new ApiError(401, "UNAUTHENTICATED", "Bạn cần đăng nhập để tiếp tục"); };

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function me() {
    const s = session.get();
    if (!s) return null;
    return db.users.find((u) => u.id === s.userId) || null;
  }
  function requireMe() { const u = me(); if (!u) unauth(); return u; }
  function publicUser(u) {
    const l = db.learning[u.id];
    return { id: u.id, email: u.email, tenHienThi: u.tenHienThi, vaiTro: u.vaiTro, muiGio: u.muiGio, anhDaiDienUrl: u.anhDaiDienUrl, trangThai: u.trangThai, daHoanTatKhoiDau: !!(l && l.onboardingDone) };
  }
  function topicName(id) { const t = db.topics.find((x) => x.id === id); return t ? t.name : "Chưa phân loại"; }
  function deckView(d, uid) {
    const count = db.cards.filter((x) => x.deckId === d.id).length;
    return Object.assign({}, d, { cardCount: count, topicName: topicName(d.topicId), favorite: !!(uid && (db.favorites[uid] || []).includes(d.id)) });
  }
  function ownDeck(id) {
    const u = requireMe();
    const d = db.decks.find((x) => x.id === id);
    if (!d || d.ownerId !== u.id || d.deleted) notFound();
    return { u, d };
  }
  function page(items, q) {
    const size = Math.max(1, Math.min(50, parseInt(q.size || "8", 10)));
    const p = Math.max(0, parseInt(q.page || "0", 10));
    const total = items.length;
    return { items: items.slice(p * size, p * size + size), page: p, size, totalElements: total, totalPages: Math.max(1, Math.ceil(total / size)) };
  }
  const norm = (s) => (s || "").toString().normalize("NFC").trim().toLowerCase().replace(/\s+/g, " ");
  const strip = (s) => norm(s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d");

  function validateDeck(b) {
    const errors = [];
    const name = (b.name || "").trim();
    if (!name) errors.push(fe("name", "Nhập tên bộ thẻ"));
    else if (name.length > 150) errors.push(fe("name", "Tên bộ thẻ tối đa 150 ký tự"));
    if ((b.description || "").length > 1000) errors.push(fe("description", "Mô tả tối đa 1000 ký tự"));
    if (!["GIAO_TIEP", "TOEIC"].includes(b.goal)) errors.push(fe("goal", "Chọn mục tiêu của bộ thẻ"));
    if (!b.topicId) errors.push(fe("topicId", "Chọn chủ đề"));
    if (!["MOI_BAT_DAU", "CO_BAN", "TRUNG_CAP", "NANG_CAO"].includes(b.level)) errors.push(fe("level", "Chọn trình độ"));
    if (errors.length) bad(errors);
  }
  function validateCard(b) {
    const errors = [];
    if (!(b.word || "").trim()) errors.push(fe("word", "Nhập từ hoặc cụm từ tiếng Anh"));
    else if (b.word.length > 100) errors.push(fe("word", "Từ tối đa 100 ký tự"));
    if (!(b.meaningVi || "").trim()) errors.push(fe("meaningVi", "Nhập nghĩa tiếng Việt"));
    else if (b.meaningVi.length > 500) errors.push(fe("meaningVi", "Nghĩa tối đa 500 ký tự"));
    if ((b.ipa || "").length > 100) errors.push(fe("ipa", "Phiên âm tối đa 100 ký tự"));
    if ((b.exampleEn || "").length > 300) errors.push(fe("exampleEn", "Ví dụ tối đa 300 ký tự"));
    if ((b.exampleVi || "").length > 300) errors.push(fe("exampleVi", "Bản dịch tối đa 300 ký tự"));
    if (errors.length) bad(errors);
  }
  function duplicatesOf(deckId, word, pos, exceptId) {
    return db.cards.filter((x) => x.deckId === deckId && x.id !== exceptId && strip(x.word) === strip(word) && norm(x.pos) === norm(pos)).map((x) => x.id);
  }
  function validPassword(p) { return typeof p === "string" && p.length >= 8 && p.length <= 72 && /[A-Za-z]/.test(p) && /\d/.test(p); }
  function rateLimit(key, limit) {
    const f = db.fails[key] || { n: 0, until: 0 };
    if (f.until > Date.now()) throw new ApiError(429, "RATE_LIMITED", "Bạn thao tác quá nhiều lần, vui lòng thử lại sau", [], { retryAfter: Math.ceil((f.until - Date.now()) / 1000) });
    return { fail() { f.n += 1; if (f.n >= limit) { f.until = Date.now() + 60000; f.n = 0; } db.fails[key] = f; }, reset() { delete db.fails[key]; } };
  }
  function parseCsv(text) {
    const rows = []; let row = []; let cell = ""; let q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ",") { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim() !== ""));
  }
  const safeCell = (v) => { const s = (v == null ? "" : String(v)); const t = /^[=+\-@\t\r]/.test(s) ? "'" + s : s; return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };

  const routes = [
    ["GET", /^\/public\/ping$/, () => ({ status: "UP", serverTime: new Date().toISOString() })],
    ["GET", /^\/auth\/csrf$/, () => ({ headerName: "X-XSRF-TOKEN", token: "demo-csrf" })],

    ["POST", /^\/auth\/register$/, (m, b) => {
      const limiter = rateLimit("register", 5);
      const errors = [];
      const email = norm(b.email);
      if (!email) errors.push(fe("email", "Vui lòng nhập email"));
      else if (!EMAIL_RE.test(email) || email.length > 255) errors.push(fe("email", "Email không hợp lệ"));
      if (!validPassword(b.password)) errors.push(fe("password", "Mật khẩu 8–72 ký tự, có chữ cái và chữ số"));
      const name = (b.tenHienThi || "").trim();
      if (!name) errors.push(fe("tenHienThi", "Vui lòng nhập tên hiển thị"));
      else if (name.length > 100) errors.push(fe("tenHienThi", "Tên hiển thị tối đa 100 ký tự"));
      if (!b.acceptTerms) errors.push(fe("acceptTerms", "Bạn cần đồng ý với điều khoản sử dụng"));
      if (errors.length) bad(errors);
      limiter.fail();
      if (db.users.some((u) => u.email === email)) throw new ApiError(409, "CONFLICT", "Email đã được sử dụng");
      const u = { id: nextId(), email, tenHienThi: name, trangThai: "CHUA_XAC_THUC", vaiTro: ["USER"], muiGio: b.muiGio || "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: b.password };
      db.users.push(u);
      db.tokens["demo-" + u.id] = { userId: u.id, type: "XAC_THUC_EMAIL", used: false, expiresAt: Date.now() + 86400000 };
      return { status: 201, body: Object.assign(publicUser(u), { demoToken: "demo-" + u.id }) };
    }],
    ["POST", /^\/auth\/verify-email$/, (m, b) => {
      const t = db.tokens[b.token];
      if (!t || t.type !== "XAC_THUC_EMAIL" || t.used || t.expiresAt < Date.now()) throw new ApiError(400, "TOKEN_INVALID", "Liên kết xác thực không hợp lệ hoặc đã hết hạn");
      t.used = true;
      const u = db.users.find((x) => x.id === t.userId);
      if (u && u.trangThai === "CHUA_XAC_THUC") u.trangThai = "HOAT_DONG";
      return { status: 204 };
    }],
    ["POST", /^\/auth\/resend-verification$/, (m, b) => {
      rateLimit("resend:" + norm(b.email), 3).fail();
      const u = db.users.find((x) => x.email === norm(b.email));
      if (u && u.trangThai === "CHUA_XAC_THUC") db.tokens["demo-" + u.id] = { userId: u.id, type: "XAC_THUC_EMAIL", used: false, expiresAt: Date.now() + 86400000 };
      return { status: 204 };
    }],
    ["POST", /^\/auth\/login$/, (m, b) => {
      const email = norm(b.email);
      const errors = [];
      if (!email) errors.push(fe("email", "Nhập email"));
      if (!b.password) errors.push(fe("password", "Nhập mật khẩu"));
      if (errors.length) bad(errors);
      const limiter = rateLimit("login:" + email, 5);
      const u = db.users.find((x) => x.email === email);
      if (!u || u.password !== b.password) { limiter.fail(); throw new ApiError(401, "INVALID_CREDENTIALS", "Email hoặc mật khẩu chưa đúng"); }
      if (u.trangThai === "CHUA_XAC_THUC") throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Tài khoản chưa xác thực email. Mở thư xác thực hoặc gửi lại thư.");
      if (u.trangThai === "BI_KHOA") throw new ApiError(403, "ACCOUNT_LOCKED", "Tài khoản đang bị khóa. Liên hệ quản trị viên để được hỗ trợ.");
      limiter.reset();
      session.set({ userId: u.id }, !!b.remember);
      return publicUser(u);
    }],
    ["POST", /^\/auth\/logout$/, () => { session.clear(); return { status: 204 }; }],
    ["POST", /^\/auth\/forgot-password$/, (m, b) => {
      if (!EMAIL_RE.test(norm(b.email))) bad([fe("email", "Email chưa đúng định dạng, ví dụ: ten@gmail.com")]);
      rateLimit("forgot:" + norm(b.email), 3).fail();
      const u = db.users.find((x) => x.email === norm(b.email));
      if (u) db.tokens["reset-" + u.id] = { userId: u.id, type: "DAT_LAI_MAT_KHAU", used: false, expiresAt: Date.now() + 1800000 };
      return { status: 202 };
    }],
    ["POST", /^\/auth\/reset-password$/, (m, b) => {
      if (!validPassword(b.password)) bad([fe("password", "Mật khẩu cần 8–72 ký tự, có cả chữ và số")]);
      const t = db.tokens[b.token];
      if (!t || t.type !== "DAT_LAI_MAT_KHAU" || t.used || t.expiresAt < Date.now()) throw new ApiError(400, "TOKEN_INVALID", "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
      t.used = true;
      const u = db.users.find((x) => x.id === t.userId);
      if (u) u.password = b.password;
      return { status: 204 };
    }],

    ["GET", /^\/me$/, () => publicUser(requireMe())],
    ["PATCH", /^\/me$/, (m, b) => {
      const u = requireMe();
      if (b.tenHienThi !== undefined) {
        const name = (b.tenHienThi || "").trim();
        if (!name) bad([fe("tenHienThi", "Nhập tên hiển thị")]);
        if (name.length > 100) bad([fe("tenHienThi", "Tên hiển thị tối đa 100 ký tự")]);
        u.tenHienThi = name;
      }
      if (b.muiGio !== undefined) u.muiGio = b.muiGio;
      if (b.anhDaiDienId !== undefined) { const f = db.files[b.anhDaiDienId]; u.anhDaiDienUrl = f ? f.url : null; }
      return publicUser(u);
    }],
    ["PUT", /^\/me\/password$/, (m, b) => {
      const u = requireMe();
      const errors = [];
      if (b.currentPassword !== u.password) errors.push(fe("currentPassword", "Mật khẩu hiện tại chưa đúng"));
      if (!validPassword(b.newPassword)) errors.push(fe("newPassword", "Mật khẩu mới cần 8–72 ký tự, có cả chữ và số"));
      else if (b.newPassword === b.currentPassword) errors.push(fe("newPassword", "Mật khẩu mới phải khác mật khẩu hiện tại"));
      if (errors.length) bad(errors);
      u.password = b.newPassword;
      return { status: 204 };
    }],
    ["GET", /^\/me\/learning-settings$/, () => {
      const u = requireMe();
      return db.learning[u.id] || { goal: null, level: null, topicIds: [], minutesPerDay: 10, newCardsPerDay: 10, onboardingDone: false, version: 0 };
    }],
    ["PUT", /^\/me\/learning-settings$/, (m, b) => {
      const u = requireMe();
      const errors = [];
      if (!["GIAO_TIEP", "TOEIC"].includes(b.goal)) errors.push(fe("goal", "Chọn mục tiêu học"));
      if (!["MOI_BAT_DAU", "CO_BAN", "TRUNG_CAP", "NANG_CAO"].includes(b.level)) errors.push(fe("level", "Chọn trình độ tự đánh giá"));
      if (!(b.minutesPerDay >= 1 && b.minutesPerDay <= 240)) errors.push(fe("minutesPerDay", "Thời gian học từ 1 đến 240 phút mỗi ngày"));
      if (!(b.newCardsPerDay >= 0 && b.newCardsPerDay <= 100)) errors.push(fe("newCardsPerDay", "Số từ mới từ 0 đến 100 mỗi ngày"));
      if ((b.topicIds || []).length > 5) errors.push(fe("topicIds", "Chọn tối đa 5 chủ đề"));
      if (errors.length) bad(errors);
      const cur = db.learning[u.id];
      if (cur && b.version !== undefined && b.version !== cur.version) throw new ApiError(409, "VERSION_CONFLICT", "Thiết lập đã được thay đổi ở nơi khác, vui lòng tải lại");
      db.learning[u.id] = { goal: b.goal, level: b.level, topicIds: b.topicIds || [], minutesPerDay: b.minutesPerDay, newCardsPerDay: b.newCardsPerDay, onboardingDone: b.onboardingDone !== false, version: cur ? cur.version + 1 : 0 };
      return db.learning[u.id];
    }],
    ["GET", /^\/me\/notification-settings$/, () => {
      const u = requireMe();
      return db.notify[u.id] || { inApp: true, email: true, studyReminder: false, reminderTime: "20:00", version: 0 };
    }],
    ["PUT", /^\/me\/notification-settings$/, (m, b) => {
      const u = requireMe();
      if (b.studyReminder && !/^\d{2}:\d{2}$/.test(b.reminderTime || "")) bad([fe("reminderTime", "Chọn giờ nhắc học")]);
      const cur = db.notify[u.id];
      db.notify[u.id] = { inApp: !!b.inApp, email: !!b.email, studyReminder: !!b.studyReminder, reminderTime: b.reminderTime || "20:00", version: cur ? cur.version + 1 : 0 };
      return db.notify[u.id];
    }],

    ["POST", /^\/files\/upload-requests$/, (m, b) => {
      requireMe();
      const images = ["image/jpeg", "image/png", "image/webp"];
      const audios = ["audio/mpeg", "audio/mp4", "audio/webm", "audio/ogg", "audio/wav"];
      const isImg = images.includes(b.contentType);
      const isAudio = audios.includes(b.contentType);
      if (!isImg && !isAudio) bad([fe("file", "Chỉ nhận ảnh JPG, PNG, WEBP hoặc âm thanh MP3, M4A, WEBM, OGG, WAV")]);
      if (isImg && b.size > 2 * 1024 * 1024) bad([fe("file", "Ảnh tối đa 2 MB")]);
      if (isAudio && b.size > 5 * 1024 * 1024) bad([fe("file", "Âm thanh tối đa 5 MB")]);
      const id = nextId();
      db.files[id] = { id, contentType: b.contentType, size: b.size, url: null, done: false };
      return { status: 201, body: { fileId: id, uploadUrl: "demo://upload/" + id, expiresAt: new Date(Date.now() + 600000).toISOString() } };
    }],
    ["POST", /^\/files\/(\w+)\/complete$/, (m, b) => {
      requireMe();
      const f = db.files[m[1]];
      if (!f) notFound();
      f.done = true; f.url = b.dataUrl || null;
      return { fileId: f.id, url: f.url };
    }],
    ["DELETE", /^\/files\/(\w+)$/, (m) => { requireMe(); delete db.files[m[1]]; return { status: 204 }; }],

    ["GET", /^\/public\/topics$/, () => db.topics.map((t) => Object.assign({}, t, { deckCount: db.decks.filter((d) => d.topicId === t.id && d.visibility === "CONG_KHAI" && !d.deleted).length }))],
    ["GET", /^\/public\/tags$/, () => db.tags],

    ["GET", /^\/library\/decks$/, (m, b, q) => {
      const u = me();
      let list = db.decks.filter((d) => d.visibility === "CONG_KHAI" && !d.deleted);
      if (q.q) { const k = strip(q.q); list = list.filter((d) => strip(d.name).includes(k) || strip(d.description).includes(k) || db.cards.some((x) => x.deckId === d.id && strip(x.word).includes(k))); }
      if (q.goal) list = list.filter((d) => d.goal === q.goal);
      if (q.topicId) list = list.filter((d) => d.topicId === q.topicId);
      if (q.level) list = list.filter((d) => d.level === q.level);
      if (q.source === "MAU") list = list.filter((d) => d.kind === "MAU");
      if (q.source === "CHIA_SE") list = list.filter((d) => d.kind === "CHIA_SE");
      if (q.recommended === "true" && u && db.learning[u.id]) { const l = db.learning[u.id]; list = list.filter((d) => d.goal === l.goal || (l.topicIds || []).includes(d.topicId)); }
      const views = list.map((d) => deckView(d, u && u.id));
      if (q.sort === "name") views.sort((a, b2) => a.name.localeCompare(b2.name, "vi"));
      else if (q.sort === "size") views.sort((a, b2) => b2.cardCount - a.cardCount);
      else views.sort((a, b2) => b2.updatedAt.localeCompare(a.updatedAt));
      return page(views, q);
    }],
    ["GET", /^\/library\/decks\/(\w+)$/, (m) => {
      const u = me();
      const d = db.decks.find((x) => x.id === m[1] && x.visibility === "CONG_KHAI" && !x.deleted);
      if (!d) notFound();
      return Object.assign(deckView(d, u && u.id), { sampleCards: db.cards.filter((x) => x.deckId === d.id).slice(0, 6) });
    }],
    ["POST", /^\/decks\/(\w+)\/copy$/, (m, b, q, h) => {
      const u = requireMe();
      const key = h["Idempotency-Key"];
      if (key && db.idem[key]) return { status: 201, body: db.idem[key] };
      const src = db.decks.find((x) => x.id === m[1] && (x.visibility === "CONG_KHAI" || x.ownerId === u.id) && !x.deleted);
      if (!src) notFound();
      const d = Object.assign({}, src, { id: nextId(), ownerId: u.id, ownerName: u.tenHienThi, visibility: "RIENG_TU", kind: "CA_NHAN", source: "Sao chép từ thư viện", sourceDeckId: src.id, updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(), version: 0 });
      db.decks.push(d);
      db.cards.filter((x) => x.deckId === src.id).forEach((x) => db.cards.push(Object.assign({}, x, { id: nextId(), deckId: d.id, version: 0 })));
      const res = { deckId: d.id, name: d.name, cardCount: db.cards.filter((x) => x.deckId === d.id).length };
      if (key) db.idem[key] = res;
      return { status: 201, body: res };
    }],

    ["GET", /^\/decks$/, (m, b, q) => {
      const u = requireMe();
      let list;
      if (q.tab === "favorites") list = db.decks.filter((d) => (db.favorites[u.id] || []).includes(d.id) && !d.deleted);
      else list = db.decks.filter((d) => d.ownerId === u.id && !d.deleted);
      if (q.q) { const k = strip(q.q); list = list.filter((d) => strip(d.name).includes(k)); }
      const views = list.map((d) => deckView(d, u.id)).sort((a, b2) => b2.updatedAt.localeCompare(a.updatedAt));
      return page(views, Object.assign({ size: "20" }, q));
    }],
    ["POST", /^\/decks$/, (m, b) => {
      const u = requireMe();
      validateDeck(b);
      const d = { id: nextId(), name: b.name.trim(), description: (b.description || "").trim(), goal: b.goal, topicId: b.topicId, level: b.level, visibility: b.visibility === "CONG_KHAI" ? "CONG_KHAI" : "RIENG_TU", kind: b.visibility === "CONG_KHAI" ? "CHIA_SE" : "CA_NHAN", ownerId: u.id, ownerName: u.tenHienThi, source: "Tự tạo", updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(), version: 0, sourceDeckId: null };
      db.decks.push(d);
      return { status: 201, body: deckView(d, u.id) };
    }],
    ["GET", /^\/decks\/(\w+)$/, (m) => { const { u, d } = ownDeck(m[1]); return deckView(d, u.id); }],
    ["PATCH", /^\/decks\/(\w+)$/, (m, b) => {
      const { u, d } = ownDeck(m[1]);
      if (b.version !== undefined && b.version !== d.version) throw new ApiError(409, "VERSION_CONFLICT", "Bộ thẻ đã được sửa ở nơi khác. Tải lại để xem bản mới nhất.");
      validateDeck(Object.assign({}, d, b));
      ["name", "description", "goal", "topicId", "level"].forEach((k) => { if (b[k] !== undefined) d[k] = typeof b[k] === "string" ? b[k].trim() : b[k]; });
      if (b.visibility) { d.visibility = b.visibility; d.kind = b.visibility === "CONG_KHAI" ? "CHIA_SE" : "CA_NHAN"; }
      d.version += 1; d.updatedAt = new Date().toISOString();
      return deckView(d, u.id);
    }],
    ["DELETE", /^\/decks\/(\w+)$/, (m) => { const { d } = ownDeck(m[1]); d.deleted = true; return { status: 204 }; }],
    ["PUT", /^\/decks\/(\w+)\/favorite$/, (m) => {
      const u = requireMe();
      const d = db.decks.find((x) => x.id === m[1] && (x.visibility === "CONG_KHAI" || x.ownerId === u.id) && !x.deleted);
      if (!d) notFound();
      const f = db.favorites[u.id] = db.favorites[u.id] || [];
      if (!f.includes(d.id)) f.push(d.id);
      return { status: 204 };
    }],
    ["DELETE", /^\/decks\/(\w+)\/favorite$/, (m) => { const u = requireMe(); db.favorites[u.id] = (db.favorites[u.id] || []).filter((x) => x !== m[1]); return { status: 204 }; }],

    ["GET", /^\/decks\/(\w+)\/cards$/, (m, b, q) => {
      ownDeck(m[1]);
      let list = db.cards.filter((x) => x.deckId === m[1]);
      if (q.q) { const k = strip(q.q); list = list.filter((x) => strip(x.word).includes(k) || strip(x.meaningVi).includes(k)); }
      list = list.map((x) => Object.assign({}, x, { duplicateOf: duplicatesOf(m[1], x.word, x.pos, x.id) }));
      return page(list, Object.assign({ size: "50" }, q));
    }],
    ["POST", /^\/decks\/(\w+)\/cards$/, (m, b) => {
      const { d } = ownDeck(m[1]);
      validateCard(b);
      const card = { id: nextId(), deckId: d.id, word: b.word.trim(), pos: (b.pos || "").trim(), ipa: (b.ipa || "").trim(), meaningVi: b.meaningVi.trim(), exampleEn: (b.exampleEn || "").trim(), exampleVi: (b.exampleVi || "").trim(), difficulty: b.difficulty || 2, tagIds: b.tagIds || [], imageUrl: b.imageUrl || null, audioUrl: b.audioUrl || null, version: 0, createdAt: new Date().toISOString() };
      const dup = duplicatesOf(d.id, card.word, card.pos);
      db.cards.push(card);
      d.updatedAt = new Date().toISOString();
      return { status: 201, body: Object.assign({}, card, { duplicateOf: dup }) };
    }],
    ["GET", /^\/cards\/(\w+)$/, (m) => {
      const card = db.cards.find((x) => x.id === m[1]);
      if (!card) notFound();
      ownDeck(card.deckId);
      return card;
    }],
    ["PATCH", /^\/cards\/(\w+)$/, (m, b) => {
      const card = db.cards.find((x) => x.id === m[1]);
      if (!card) notFound();
      ownDeck(card.deckId);
      if (b.version !== undefined && b.version !== card.version) throw new ApiError(409, "VERSION_CONFLICT", "Thẻ đã được sửa ở nơi khác. Tải lại để xem bản mới nhất.");
      validateCard(Object.assign({}, card, b));
      ["word", "pos", "ipa", "meaningVi", "exampleEn", "exampleVi", "difficulty", "tagIds", "imageUrl", "audioUrl"].forEach((k) => { if (b[k] !== undefined) card[k] = typeof b[k] === "string" ? b[k].trim() : b[k]; });
      card.version += 1;
      return Object.assign({}, card, { duplicateOf: duplicatesOf(card.deckId, card.word, card.pos, card.id) });
    }],
    ["DELETE", /^\/cards\/(\w+)$/, (m) => {
      const card = db.cards.find((x) => x.id === m[1]);
      if (!card) notFound();
      ownDeck(card.deckId);
      db.cards = db.cards.filter((x) => x.id !== card.id);
      return { status: 204 };
    }],

    ["POST", /^\/decks\/(\w+)\/imports\/preview$/, (m, b) => {
      const { d } = ownDeck(m[1]);
      const text = b.csv || "";
      if (!text.trim()) bad([fe("file", "Tệp CSV trống")]);
      if (text.length > 1024 * 1024) bad([fe("file", "Tệp CSV tối đa 1 MB")]);
      const rows = parseCsv(text);
      const header = (rows.shift() || []).map((h) => norm(h));
      const need = ["word", "meaning_vi"];
      const missing = need.filter((h) => !header.includes(h));
      if (missing.length) throw new ApiError(422, "BUSINESS_RULE", "Tệp thiếu cột bắt buộc: " + missing.join(", ") + ". Dòng đầu phải là tên cột.");
      if (rows.length > 1000) throw new ApiError(422, "BUSINESS_RULE", "Tệp có " + rows.length + " dòng, tối đa 1000 dòng mỗi lần nhập");
      const col = (r, name) => { const i = header.indexOf(name); return i >= 0 ? (r[i] || "").trim() : ""; };
      const seen = {};
      const out = rows.map((r, i) => {
        const x = { line: i + 2, word: col(r, "word"), pos: col(r, "pos"), ipa: col(r, "ipa"), meaningVi: col(r, "meaning_vi"), exampleEn: col(r, "example_en"), exampleVi: col(r, "example_vi") };
        const errors = [];
        if (!x.word) errors.push("Thiếu từ");
        else if (x.word.length > 100) errors.push("Từ dài quá 100 ký tự");
        if (!x.meaningVi) errors.push("Thiếu nghĩa tiếng Việt");
        [x.word, x.meaningVi, x.exampleEn].forEach((v) => { if (/^[=+\-@]/.test(v)) errors.push("Ô bắt đầu bằng ký tự công thức (= + - @)"); });
        const k = strip(x.word) + "|" + norm(x.pos);
        let status = errors.length ? "ERROR" : "OK";
        let note = errors.join("; ");
        if (status === "OK" && (duplicatesOf(d.id, x.word, x.pos).length || seen[k])) { status = "DUPLICATE"; note = seen[k] ? "Trùng với dòng " + seen[k] + " trong tệp" : "Đã có trong bộ thẻ"; }
        if (!seen[k]) seen[k] = x.line;
        return Object.assign(x, { status, note });
      });
      const id = nextId();
      db.imports[id] = { deckId: d.id, rows: out, committed: false };
      const count = (s) => out.filter((x) => x.status === s).length;
      return { importId: id, expiresInMinutes: 30, rows: out, summary: { total: out.length, ok: count("OK"), duplicate: count("DUPLICATE"), error: count("ERROR") } };
    }],
    ["POST", /^\/imports\/(\w+)\/commit$/, (m, b, q, h) => {
      requireMe();
      const imp = db.imports[m[1]];
      if (!imp) throw new ApiError(404, "NOT_FOUND", "Phiên nhập đã hết hạn (30 phút). Hãy tải tệp lên lại.");
      if (imp.committed) return imp.result;
      ownDeck(imp.deckId);
      const lines = new Set(b.lines || []);
      const chosen = imp.rows.filter((x) => lines.has(x.line) && x.status !== "ERROR");
      chosen.forEach((x) => db.cards.push({ id: nextId(), deckId: imp.deckId, word: x.word, pos: x.pos, ipa: x.ipa, meaningVi: x.meaningVi, exampleEn: x.exampleEn, exampleVi: x.exampleVi, difficulty: 2, tagIds: [], imageUrl: null, audioUrl: null, version: 0, createdAt: new Date().toISOString() }));
      imp.committed = true;
      imp.result = { created: chosen.length, skipped: imp.rows.length - chosen.length };
      return imp.result;
    }],
    ["GET", /^\/decks\/(\w+)\/export$/, (m) => {
      ownDeck(m[1]);
      const head = "word,pos,ipa,meaning_vi,example_en,example_vi";
      const body = db.cards.filter((x) => x.deckId === m[1]).map((x) => [x.word, x.pos, x.ipa, x.meaningVi, x.exampleEn, x.exampleVi].map(safeCell).join(","));
      return { csv: "﻿" + [head].concat(body).join("\n") };
    }],

    ["GET", /^\/admin\/topics$/, () => { const u = requireMe(); if (!u.vaiTro.includes("ADMIN")) throw new ApiError(403, "FORBIDDEN", "Bạn không có quyền truy cập"); return db.topics.map((t) => Object.assign({}, t, { deckCount: db.decks.filter((d) => d.topicId === t.id && !d.deleted).length })); }],
    ["POST", /^\/admin\/topics$/, (m, b) => {
      requireAdmin();
      const name = (b.name || "").trim();
      if (!name) bad([fe("name", "Nhập tên chủ đề")]);
      if (name.length > 80) bad([fe("name", "Tên chủ đề tối đa 80 ký tự")]);
      if (db.topics.some((t) => strip(t.name) === strip(name))) throw new ApiError(409, "CONFLICT", "Chủ đề này đã tồn tại", [fe("name", "Chủ đề này đã tồn tại")]);
      const t = { id: nextId(), name, slug: strip(name).replace(/[^a-z0-9]+/g, "-") };
      db.topics.push(t);
      return { status: 201, body: t };
    }],
    ["PATCH", /^\/admin\/topics\/(\w+)$/, (m, b) => {
      requireAdmin();
      const t = db.topics.find((x) => x.id === m[1]);
      if (!t) notFound();
      const name = (b.name || "").trim();
      if (!name) bad([fe("name", "Nhập tên chủ đề")]);
      t.name = name;
      return t;
    }],
    ["DELETE", /^\/admin\/topics\/(\w+)$/, (m) => {
      requireAdmin();
      const used = db.decks.filter((d) => d.topicId === m[1] && !d.deleted).length;
      if (used) throw new ApiError(422, "BUSINESS_RULE", "Chủ đề đang được " + used + " bộ thẻ sử dụng. Chuyển các bộ sang chủ đề khác trước khi xóa.");
      db.topics = db.topics.filter((x) => x.id !== m[1]);
      return { status: 204 };
    }],
    ["GET", /^\/admin\/tags$/, () => { requireAdmin(); return db.tags.map((t) => Object.assign({}, t, { cardCount: db.cards.filter((c2) => (c2.tagIds || []).includes(t.id)).length })); }],
    ["POST", /^\/admin\/tags$/, (m, b) => {
      requireAdmin();
      const name = (b.name || "").trim();
      if (!name) bad([fe("name", "Nhập tên nhãn")]);
      if (name.length > 40) bad([fe("name", "Tên nhãn tối đa 40 ký tự")]);
      if (db.tags.some((t) => strip(t.name) === strip(name))) throw new ApiError(409, "CONFLICT", "Nhãn này đã tồn tại", [fe("name", "Nhãn này đã tồn tại")]);
      const t = { id: nextId(), name };
      db.tags.push(t);
      return { status: 201, body: t };
    }],
    ["DELETE", /^\/admin\/tags\/(\w+)$/, (m) => { requireAdmin(); db.tags = db.tags.filter((x) => x.id !== m[1]); db.cards.forEach((x) => { x.tagIds = (x.tagIds || []).filter((t) => t !== m[1]); }); return { status: 204 }; }]
  ];

  function requireAdmin() { const u = requireMe(); if (!u.vaiTro.includes("ADMIN")) throw new ApiError(403, "FORBIDDEN", "Bạn không có quyền truy cập"); return u; }

  function handle(method, url, body, headers) {
    const [path, qs] = url.split("?");
    const q = Object.fromEntries(new URLSearchParams(qs || ""));
    for (const [m, re, fn] of routes) {
      if (m !== method) continue;
      const match = path.match(re);
      if (!match) continue;
      let out;
      try { out = fn(match, body || {}, q, headers || {}); } finally { save(db); }
      if (out && out.status) return { status: out.status, body: out.body === undefined ? null : out.body };
      return { status: 200, body: out };
    }
    notFound();
  }

  window.VLDemo = {
    ApiError,
    DEMO_PASSWORD,
    handle,
    session,
    reset() { localStorage.removeItem(KEY); session.clear(); db = load(); },
    get db() { return db; },
    tokenFor(email) {
      const u = db.users.find((x) => x.email === norm(email));
      return u ? "demo-" + u.id : null;
    },
    resetTokenFor(email) {
      const u = db.users.find((x) => x.email === norm(email));
      return u && db.tokens["reset-" + u.id] ? "reset-" + u.id : null;
    }
  };
})();
