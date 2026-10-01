(function () {
  const KEY = "vl-demo-v4";
  const SESSION = "vl-demo-session";
  const DEMO_PASSWORD = "Vocab@12345";

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
  const MIN = 60000;
  const DAY = 86400000;
  const ALGO = "sm2-vl-1";
  const AVG_SECONDS = 15;
  const RATINGS = ["QUEN", "KHO", "NHO", "DE"];
  const RATING_Q = { QUEN: 1, KHO: 3, NHO: 4, DE: 5 };
  const DIRS = ["EN_VI", "VI_EN"];

  function localDate(ms, tz) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
  }
  function tzOffsetMs(ms, tz) {
    let name = "GMT";
    try { name = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(new Date(ms)).find((p) => p.type === "timeZoneName").value; } catch (e) {}
    const m = name.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
    if (!m) return 0;
    return (m[1] === "-" ? -1 : 1) * (parseInt(m[2], 10) * 60 + parseInt(m[3] || "0", 10)) * MIN;
  }
  function startOfLocalDay(ms, tz) {
    const guess = Date.parse(localDate(ms, tz) + "T00:00:00Z");
    return guess - tzOffsetMs(guess, tz);
  }
  function newProgress() {
    return { trangThai: "MOI", buocHoc: 0, ef: 2.5, khoangOnNgay: 0, chuoiThanhCong: 0, soLanQuen: 0, hanOnAt: null, version: 0 };
  }

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
      { id: "22", name: "Giao tiếp hằng ngày cho người mới", description: "Bản sao để tự thêm câu của mình.", goal: "GIAO_TIEP", topicId: "7", level: "MOI_BAT_DAU", visibility: "RIENG_TU", kind: "CA_NHAN", ownerId: "2", ownerName: "Nguyễn An", source: "Sao chép từ thư viện", updatedAt: days(2), sourceDeckId: "12" },
      { id: "31", name: "Ôn thi TOEIC tháng 6 — gom từ mọi bộ", description: "Bộ ôn chung trước kỳ thi, bỏ dở từ tháng trước.", goal: "TOEIC", topicId: "1", level: "CO_BAN", visibility: "RIENG_TU", kind: "CA_NHAN", ownerId: "3", ownerName: "Lê Bình", source: "Tự tạo", updatedAt: days(40), sourceDeckId: null },
      { id: "33", name: "Hợp đồng & pháp lý cơ bản", description: "Điều khoản, bên ký kết, gia hạn và chấm dứt hợp đồng.", goal: "TOEIC", topicId: "8", level: "TRUNG_CAP", visibility: "RIENG_TU", kind: "MAU", ownerId: "0", ownerName: "Nhóm biên soạn VocabLearning", source: "Tự biên soạn", updatedAt: days(1), sourceDeckId: null },
      { id: "34", name: "Từ vựng hội nghị, triển lãm thương mại và chuyến công tác nước ngoài dành cho nhân viên kinh doanh xuất nhập khẩu đang ôn TOEIC 750+ trong ba tháng", description: "Bản nháp, đang bổ sung ví dụ.", goal: "TOEIC", topicId: "6", level: "NANG_CAO", visibility: "RIENG_TU", kind: "MAU", ownerId: "0", ownerName: "Nhóm biên soạn VocabLearning", source: "Tự biên soạn", updatedAt: days(3), sourceDeckId: null, trangThaiKiemDuyet: "DA_AN" }
    ];
    decks.forEach((d) => { d.version = 0; d.createdAt = d.updatedAt; d.trangThaiKiemDuyet = d.trangThaiKiemDuyet || "BINH_THUONG"; });

    addCards("11", OFFICE);
    addCards("12", DAILY);
    addCards("13", TRAVEL);
    addCards("14", HR);
    addCards("15", [OFFICE[1], OFFICE[7]].map((x) => Object.assign({}, x)));
    addCards("16", [OFFICE[8], OFFICE[0]].map((x) => Object.assign({}, x)));
    addCards("17", [DAILY[4]].map((x) => Object.assign({}, x)));
    addCards("21", [OFFICE[1], OFFICE[4], OFFICE[7], HR[2]].map((x) => Object.assign({}, x)).concat([
      c("complementary", "adj.", "/ˌkɑːmplɪˈmentri/", "bổ sung cho nhau, bổ trợ", "The two courses are complementary.", "Hai khóa học bổ trợ cho nhau.", { tagIds: ["5"], difficulty: 3 }),
      c("recipe", "n.", "/ˈresəpi/", "công thức nấu ăn", "This recipe needs two eggs.", "Công thức này cần hai quả trứng.", { tagIds: ["5"] })
    ]));
    addCards("22", DAILY.map((x) => Object.assign({}, x)));
    addCards("31", OFFICE.concat(DAILY, TRAVEL, HR).map((x) => Object.assign({}, x)));

    const users = [
      { id: "1", email: "admin@vocab.local", tenHienThi: "Quản trị viên", trangThai: "HOAT_DONG", vaiTro: ["ADMIN", "USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "2", email: "an@vocab.local", tenHienThi: "Nguyễn An", trangThai: "HOAT_DONG", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "3", email: "binh@vocab.local", tenHienThi: "Lê Bình", trangThai: "HOAT_DONG", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "4", email: "chi@vocab.local", tenHienThi: "Phạm Chi", trangThai: "CHUA_XAC_THUC", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "5", email: "dung.tran@vocab.local", tenHienThi: "Trần Dũng", trangThai: "HOAT_DONG", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "6", email: "hoa.le@vocab.local", tenHienThi: "Lê Thị Hoa", trangThai: "BI_KHOA", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "7", email: "khanh.nguyen@vocab.local", tenHienThi: "Nguyễn Khánh", trangThai: "HOAT_DONG", vaiTro: ["USER"], muiGio: "Asia/Bangkok", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "8", email: "phuongthao.tonnu.luyenthi.toeic.buoitoi@vocab.local", tenHienThi: "Tôn Nữ Hoàng Phương Thảo Nguyên, lớp luyện thi TOEIC buổi tối khóa K28", trangThai: "HOAT_DONG", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "9", email: "minh.pham@vocab.local", tenHienThi: "Phạm Minh", trangThai: "DANG_XOA", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "10", email: "linh.vo@vocab.local", tenHienThi: "Võ Linh", trangThai: "HOAT_DONG", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "11", email: "quang.do@vocab.local", tenHienThi: "Đỗ Quang", trangThai: "CHUA_XAC_THUC", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD },
      { id: "12", email: "trang.bui@vocab.local", tenHienThi: "Bùi Trang", trangThai: "HOAT_DONG", vaiTro: ["USER"], muiGio: "Asia/Ho_Chi_Minh", anhDaiDienUrl: null, password: DEMO_PASSWORD }
    ];
    users.forEach((u, i) => { u.createdAt = days(60 - i * 4); u.dangNhapCuoiAt = u.trangThai === "CHUA_XAC_THUC" ? null : days(i % 5); });
    users.find((u) => u.id === "3").dangNhapCuoiAt = days(38);

    const learning = {
      "2": { goal: "TOEIC", level: "CO_BAN", topicIds: ["1", "2"], minutesPerDay: 15, newCardsPerDay: 10, onboardingDone: true, version: 0 },
      "3": { goal: "TOEIC", level: "TRUNG_CAP", topicIds: ["1"], minutesPerDay: 5, newCardsPerDay: 10, onboardingDone: true, version: 0 }
    };
    const notify = {
      "2": { inApp: true, email: true, studyReminder: true, reminderTime: "20:30", version: 0 }
    };

    const s = { users, decks, cards, topics: TOPICS.slice(), tags: TAGS.slice(), learning, notify, favorites: { "2": ["11"] }, tokens: {}, files: {}, imports: {}, idem: {}, seq: 500, fails: {},
      progress: {}, sessions: {}, events: {}, reviews: [], usage: {}, practice: {}, attempts: [], answers: [], errors: [], pairs: [], notebook: {}, audit: [] };
    seedLearning(s);
    return s;
  }

  function seedLearning(s) {
    const tz = "Asia/Ho_Chi_Minh";
    const card = (deckId, word) => s.cards.find((x) => x.deckId === deckId && x.word === word).id;
    const sod = startOfLocalDay(now, tz);
    const put = (uid, theId, dir, p) => { s.progress[uid + "|" + theId + "|" + dir] = Object.assign(newProgress(), p); };
    const iso = (ms) => new Date(ms).toISOString();

    put("2", card("21", "receipt"), "EN_VI", { trangThai: "ON_TAP", ef: 2.18, khoangOnNgay: 3, chuoiThanhCong: 2, soLanQuen: 3, hanOnAt: iso(sod + 2 * 3600000), version: 7 });
    put("2", card("21", "receipt"), "VI_EN", { trangThai: "ON_TAP", ef: 2.5, khoangOnNgay: 6, chuoiThanhCong: 2, soLanQuen: 0, hanOnAt: iso(sod + 3 * DAY), version: 3 });
    put("2", card("21", "postpone"), "EN_VI", { trangThai: "ON_TAP", ef: 2.5, khoangOnNgay: 6, chuoiThanhCong: 2, soLanQuen: 0, hanOnAt: iso(sod - 2 * DAY), version: 3 });
    put("2", card("21", "complimentary"), "EN_VI", { trangThai: "HOC_LAI", ef: 1.96, khoangOnNgay: 4, chuoiThanhCong: 0, soLanQuen: 2, hanOnAt: iso(now - 5 * MIN), version: 6 });
    put("2", card("21", "uncharacteristically"), "EN_VI", { trangThai: "DANG_HOC", buocHoc: 1, hanOnAt: iso(now - 20 * MIN), version: 1 });
    put("2", card("21", "complementary"), "EN_VI", { trangThai: "ON_TAP", ef: 2.36, khoangOnNgay: 1, chuoiThanhCong: 1, soLanQuen: 1, hanOnAt: iso(sod - DAY), version: 4 });
    put("2", card("22", "How's it going?"), "EN_VI", { trangThai: "ON_TAP", ef: 2.6, khoangOnNgay: 15, chuoiThanhCong: 3, hanOnAt: iso(sod + 4 * DAY), version: 3 });
    put("2", card("22", "I'm running late"), "EN_VI", { trangThai: "TAM_NGUNG", truocTamNgung: { trangThai: "ON_TAP", hanOnAt: iso(sod + DAY) }, ef: 2.5, khoangOnNgay: 1, chuoiThanhCong: 1, hanOnAt: iso(sod + DAY), version: 2 });
    put("2", card("22", "get along with"), "EN_VI", { trangThai: "ON_TAP", ef: 2.5, khoangOnNgay: 1, chuoiThanhCong: 1, hanOnAt: iso(sod - DAY), version: 2 });

    s.cards.filter((x) => x.deckId === "31").forEach((x, i) => {
      ["EN_VI", "VI_EN"].forEach((dir, j) => put("3", x.id, dir, { trangThai: "ON_TAP", ef: 2.3, khoangOnNgay: 3 + (i % 4), chuoiThanhCong: 2, soLanQuen: (i * 7 + j) % 5, hanOnAt: iso(sod - (12 + (i % 9)) * DAY), version: 3 }));
    });

    const anCards = s.cards.filter((x) => x.deckId === "21" || x.deckId === "22");
    const ratings = ["NHO", "NHO", "KHO", "NHO", "DE", "QUEN", "NHO", "KHO", "NHO", "DE"];
    const studyDays = { 1: 12, 2: 9, 3: 14, 5: 6, 6: 11, 8: 4, 9: 10, 10: 8, 13: 12, 16: 7, 17: 9, 22: 6, 24: 5 };
    let k = 0;
    Object.keys(studyDays).forEach((d) => {
      const base = sod - Number(d) * DAY + 20 * 3600000;
      for (let i = 0; i < studyDays[d]; i++) {
        const cc = anCards[(k * 3 + i) % anCards.length];
        const rating = ratings[(k + i) % ratings.length];
        s.reviews.push({ id: "r" + (++k), uid: "2", clientEventId: "seed-" + k, phienId: "seed-" + d, theId: cc.id, chieuHoc: i % 3 === 0 ? "VI_EN" : "EN_VI", danhGia: rating, thoiGianTraLoiMs: 4000 + ((k * 1733) % 11000), createdAt: iso(base + i * 45000), truoc: { trangThai: "ON_TAP" }, sau: { trangThai: rating === "QUEN" ? "HOC_LAI" : "ON_TAP" }, phienBanThuatToan: ALGO });
      }
    });

    const rc = card("21", "receipt"), cp = card("21", "complimentary"), cm = card("21", "complementary"), rp = card("21", "recipe"), un = card("21", "uncharacteristically");
    const at = (d, h) => iso(sod - d * DAY + h * 3600000);
    s.pairs.push(
      { id: "p1", uid: "2", the1Id: cp, the2Id: cm, loaiNham: "HINH_THUC_GAN_GIONG", soLan: 1, ganNhatAt: at(14, 20) },
      { id: "p2", uid: "2", the1Id: rc, the2Id: rp, loaiNham: "HINH_THUC_GAN_GIONG", soLan: 1, ganNhatAt: at(15, 20) }
    );
    s.notebook["2"] = { [un]: { ghiChu: "Đọc tách: un-cha-rac-te-ris-ti-cal-ly. Đuôi -ically, không phải -icly.", danhDauThuCong: true, anTu: null } };

    const admin = { id: "1", tenHienThi: "Quản trị viên" };
    s.audit.push(
      { id: "a1", nguoiThucHien: admin, hanhDong: "XUAT_BAN_BO_MAU", doiTuong: { loai: "BO_THE", id: "16", ten: "Tài chính cơ bản" }, lyDo: "Đã kiểm tra nguồn và ví dụ của 2 thẻ", truoc: { quyenTruyCap: "RIENG_TU" }, sau: { quyenTruyCap: "CONG_KHAI" }, createdAt: at(20, 9) },
      { id: "a2", nguoiThucHien: admin, hanhDong: "TAO_BO_MAU", doiTuong: { loai: "BO_THE", id: "33", ten: "Hợp đồng & pháp lý cơ bản" }, lyDo: null, truoc: null, sau: { ten: "Hợp đồng & pháp lý cơ bản", quyenTruyCap: "RIENG_TU" }, createdAt: at(1, 10) },
      { id: "a3", nguoiThucHien: admin, hanhDong: "KHOA_TAI_KHOAN", doiTuong: { loai: "NGUOI_DUNG", id: "6", ten: "Lê Thị Hoa" }, lyDo: "Đăng quảng cáo lặp lại trong mô tả bộ chia sẻ công khai sau khi đã được nhắc qua email ngày 12/10", truoc: { trangThai: "HOAT_DONG" }, sau: { trangThai: "BI_KHOA" }, createdAt: at(4, 15) }
    );
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
  function ownedFile(id, allowDeleted) {
    const u = requireMe(), f = db.files[id];
    if (!f || f.ownerId !== u.id || (f.deleted && !allowDeleted)) notFound();
    return f;
  }
  function fileResponse(f) {
    if (!f.hoanTatAt) throw new ApiError(422, "BUSINESS_RULE", "Tệp chưa hoàn tất tải lên");
    return { id: f.id, loai: f.loai, mimeType: f.mimeType, kichThuoc: f.kichThuoc, checksum: f.checksum, hoanTatAt: f.hoanTatAt, downloadUrl: f.url, expiresAt: new Date(Date.now() + 600000).toISOString() };
  }
  async function put(uploadUrl, file) {
    if (flags.offline) throw new ApiError(0, "NETWORK_ERROR", "Mất kết nối mạng. Hãy thử lại.");
    const match = /^demo:\/\/upload\/(\w+)$/.exec(uploadUrl);
    if (!match) notFound();
    const f = ownedFile(match[1]);
    const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    const checksum = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    if (file.type !== f.mimeType || file.size !== f.kichThuoc || checksum !== f.checksum) bad([fe("file", "Tệp tải lên không khớp yêu cầu")]);
    f.url = await new Promise((resolve, reject) => {
      const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
    });
    save(db);
  }
  function publicUser(u) {
    const l = db.learning[u.id];
    return { id: u.id, email: u.email, tenHienThi: u.tenHienThi, vaiTro: u.vaiTro, muiGio: u.muiGio, anhDaiDienId: u.anhDaiDienId || null, trangThai: u.trangThai, daHoanTatKhoiDau: !!(l && l.onboardingDone) };
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

  const flags = { offline: false, conflictOnce: false };
  const iso = (ms) => new Date(ms).toISOString();
  const tzOf = (u) => (u && u.muiGio) || "Asia/Ho_Chi_Minh";
  const cardById = (id) => db.cards.find((x) => x.id === id);
  const deckName = (id) => { const d = db.decks.find((x) => x.id === id); return d ? d.name : ""; };
  const reason = (v) => (v || "").toString().trim();

  function theView(x) {
    return { id: x.id, boTheId: x.deckId, tu: x.word, tuLoai: x.pos, phienAm: x.ipa, nghiaVi: x.meaningVi, viDuEn: x.exampleEn, dichVi: x.exampleVi, anhUrl: x.imageUrl, amThanhUrl: x.audioUrl, version: x.version };
  }
  function ownCards(uid, deckId) {
    const ids = db.decks.filter((d) => d.ownerId === uid && !d.deleted && (!deckId || d.id === deckId)).map((d) => d.id);
    return db.cards.filter((x) => ids.includes(x.deckId));
  }
  const pkey = (uid, theId, dir) => uid + "|" + theId + "|" + dir;
  function progressOf(uid, theId, dir) { return db.progress[pkey(uid, theId, dir)] || newProgress(); }
  function setProgress(uid, theId, dir, p) { db.progress[pkey(uid, theId, dir)] = p; }
  function progressView(p) {
    return { trangThai: p.trangThai, buocHoc: p.buocHoc, ef: Math.round(p.ef * 100) / 100, khoangOnNgay: p.khoangOnNgay, chuoiThanhCong: p.chuoiThanhCong, soLanQuen: p.soLanQuen, hanOnAt: p.hanOnAt, version: p.version };
  }
  function physicallyNew(uid, theId) {
    return DIRS.every((d) => {
      const p = db.progress[pkey(uid, theId, d)];
      return !p || p.trangThai === "MOI" || (p.trangThai === "TAM_NGUNG" && p.truocTamNgung && p.truocTamNgung.trangThai === "MOI");
    });
  }
  function usageOf(uid, day) { const k = uid + "|" + day; return db.usage[k] || (db.usage[k] = { soTheMoi: 0, soLuotHopLe: 0 }); }

  function srsNext(p, rating, t, tz) {
    const q = RATING_Q[rating];
    const n = Object.assign({}, p);
    const inMin = (m) => iso(t + m * MIN);
    const inDays = (d) => { const dd = Math.min(365, d); n.khoangOnNgay = dd; return iso(startOfLocalDay(t, tz) + dd * DAY); };
    const graduate = (d) => { n.trangThai = "ON_TAP"; n.buocHoc = 0; n.chuoiThanhCong = 1; n.hanOnAt = inDays(d); };
    if (p.trangThai === "MOI" || (p.trangThai === "DANG_HOC" && p.buocHoc === 0)) {
      if (rating === "DE") graduate(4);
      else { n.trangThai = "DANG_HOC"; n.buocHoc = rating === "NHO" ? 1 : 0; n.hanOnAt = inMin(rating === "QUEN" ? 1 : rating === "KHO" ? 5 : 10); }
    } else if (p.trangThai === "DANG_HOC") {
      if (rating === "QUEN") { n.buocHoc = 0; n.hanOnAt = inMin(1); }
      else if (rating === "KHO") n.hanOnAt = inMin(10);
      else graduate(rating === "NHO" ? 1 : 4);
    } else if (p.trangThai === "HOC_LAI") {
      if (rating === "QUEN") n.hanOnAt = inMin(1);
      else if (rating === "KHO") n.hanOnAt = inMin(10);
      else graduate(rating === "NHO" ? 1 : 2);
    } else {
      const I = Math.max(1, p.khoangOnNgay || 1);
      const ef = Math.max(1.3, p.ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
      n.ef = ef;
      if (rating === "QUEN") { n.trangThai = "HOC_LAI"; n.soLanQuen = p.soLanQuen + 1; n.chuoiThanhCong = 0; n.hanOnAt = inMin(10); }
      else {
        let d;
        if (rating === "KHO") d = Math.max(I + 1, Math.round(I * 1.2));
        else if (rating === "NHO") d = p.chuoiThanhCong === 1 ? 6 : Math.max(I + 1, Math.round(I * ef));
        else d = Math.max(I + 1, Math.round(I * ef * 1.3));
        n.chuoiThanhCong = p.chuoiThanhCong + 1;
        n.hanOnAt = inDays(d);
      }
    }
    return n;
  }
  function intervalLabel(from, toIso, tz) {
    if (!toIso) return "";
    const t = Date.parse(toIso);
    const mins = Math.round((t - from) / MIN);
    if (mins < 60) return Math.max(1, mins) + " phút";
    const d = Math.round((startOfLocalDay(t, tz) - startOfLocalDay(from, tz)) / DAY);
    if (d <= 0) return Math.round(mins / 60) + " giờ";
    return d + " ngày";
  }
  function previewOf(p, t, tz) { const o = {}; RATINGS.forEach((r) => { o[r] = intervalLabel(t, srsNext(p, r, t, tz).hanOnAt, tz); }); return o; }

  function streakOf(uid, tz) {
    const cnt = {};
    const ok = new Set();
    db.reviews.filter((r) => r.uid === uid).forEach((r) => {
      const d = localDate(Date.parse(r.createdAt), tz);
      const k = d + "|" + r.phienId;
      cnt[k] = (cnt[k] || 0) + 1;
      if (cnt[k] >= 5) ok.add(d);
    });
    const t = Date.now();
    const today = localDate(t, tz);
    let cursor = startOfLocalDay(t, tz) + 12 * 3600000;
    if (!ok.has(today)) cursor -= DAY;
    let n = 0;
    while (ok.has(localDate(cursor, tz))) { n++; cursor -= DAY; }
    return { chuoiNgay: n, homNayDaTinh: ok.has(today) };
  }

  function todayPlan(u, q) {
    const tz = tzOf(u);
    const t = Date.now();
    const sod = startOfLocalDay(t, tz);
    const eod = sod + DAY;
    const l = db.learning[u.id] || { minutesPerDay: 10, newCardsPerDay: 10 };
    const cards = ownCards(u.id);
    let quaHan = 0;
    let denHan = 0;
    const perDeck = {};
    cards.forEach((x) => {
      const deck = perDeck[x.deckId] = perDeck[x.deckId] || { soCanOn: 0, soMoi: 0 };
      if (physicallyNew(u.id, x.id)) deck.soMoi++;
      DIRS.forEach((dir) => {
        const p = progressOf(u.id, x.id, dir);
        if (p.trangThai === "MOI" || p.trangThai === "TAM_NGUNG" || !p.hanOnAt) return;
        const h = Date.parse(p.hanOnAt);
        if (h < sod) { quaHan++; deck.soCanOn++; } else if (h < eod) { denHan++; deck.soCanOn++; }
      });
    });
    const today = localDate(t, tz);
    const used = usageOf(u.id, today);
    const newPhys = cards.filter((x) => physicallyNew(u.id, x.id)).length;
    const cap = Math.max(1, Math.floor(l.minutesPerDay * 60 / AVG_SECONDS));
    const canOn = quaHan + denHan;
    let rescue = null;
    if (quaHan > cap) {
      const phut = [5, 10, 15, 20, 30].includes(Number(q.phut)) ? Number(q.phut) : l.minutesPerDay;
      const perDay = Math.max(1, Math.floor(phut * 60 / AVG_SECONDS));
      const soNgay = Math.ceil(canOn / perDay);
      const keHoach = [];
      let left = canOn;
      for (let i = 0; i < soNgay && i < 14; i++) {
        const n = Math.min(perDay, left);
        left -= n;
        keHoach.push({ ngay: localDate(sod + i * DAY + 12 * 3600000, tz), soThe: n, phut: Math.ceil(n * AVG_SECONDS / 60) });
      }
      rescue = { soTheCanOn: canOn, soQuaHan: quaHan, phutMoiNgay: phut, luotMoiNgay: perDay, soNgay, keHoach, tamDungTuMoi: q.giuTuMoi !== "true", uuTien: "QUEN_NHIEU_VA_QUA_HAN_LAU", laUocTinh: true, giayMoiLuot: AVG_SECONDS };
    }
    const soMoiConLai = rescue && rescue.tamDungTuMoi ? 0 : Math.min(Math.max(0, l.newCardsPerDay - used.soTheMoi), newPhys);
    const todays = db.reviews.filter((r) => r.uid === u.id && localDate(Date.parse(r.createdAt), tz) === today);
    const st = streakOf(u.id, tz);
    return {
      ngay: today, muiGio: tz, soQuaHan: quaHan, soDenHan: denHan, soMoiConLai, tuMoiMoiNgay: l.newCardsPerDay, soTheMoiDaHoc: used.soTheMoi, phutMoiNgay: l.minutesPerDay,
      uocTinhPhut: Math.ceil((canOn + soMoiConLai) * AVG_SECONDS / 60), laUocTinh: true, giayMoiLuot: AVG_SECONDS,
      daHocHomNay: { soLuot: todays.length, soPhut: Math.round(todays.reduce((a, r) => a + r.thoiGianTraLoiMs, 0) / MIN) },
      chuoiNgay: st.chuoiNgay, homNayDaTinhChuoi: st.homNayDaTinh, luotToiThieuChuoi: 5, tongSoThe: cards.length,
      boThe: Object.keys(perDeck).map((id) => ({ boTheId: id, ten: deckName(id), soCanOn: perDeck[id].soCanOn, soMoi: perDeck[id].soMoi })),
      cuuLichOn: rescue
    };
  }

  function buildQueue(u, deckId, dir, minutes, mode) {
    const tz = tzOf(u);
    const t = Date.now();
    const l = db.learning[u.id] || { newCardsPerDay: 10 };
    const cap = Math.max(1, Math.floor(minutes * 60 / AVG_SECONDS));
    const items = ownCards(u.id, deckId).map((x) => ({ x, p: progressOf(u.id, x.id, dir) }));
    const due = (it) => it.p.hanOnAt && Date.parse(it.p.hanOnAt) <= t;
    const byDue = (a, b) => Date.parse(a.p.hanOnAt) - Date.parse(b.p.hanOnAt);
    const steps = items.filter((it) => (it.p.trangThai === "DANG_HOC" || it.p.trangThai === "HOC_LAI") && due(it)).sort(byDue);
    const reviews = items.filter((it) => it.p.trangThai === "ON_TAP" && due(it)).sort(mode === "CUU_LICH" ? (a, b) => b.p.soLanQuen - a.p.soLanQuen || byDue(a, b) : byDue);
    const plan = todayPlan(u, {});
    const newLimit = mode === "CUU_LICH" || (plan.cuuLichOn && plan.cuuLichOn.tamDungTuMoi) ? 0 : Math.max(0, l.newCardsPerDay - usageOf(u.id, localDate(t, tz)).soTheMoi);
    let used = 0;
    const fresh = [];
    items.filter((it) => it.p.trangThai === "MOI").forEach((it) => {
      const phys = physicallyNew(u.id, it.x.id);
      if (phys && used >= newLimit) return;
      if (phys) used++;
      fresh.push(it);
    });
    return steps.concat(reviews, fresh).slice(0, cap);
  }

  function sessionView(s, u) {
    const t = Date.now();
    return {
      id: s.id, boTheId: s.boTheId, boTheTen: s.boTheId ? deckName(s.boTheId) : "Tất cả bộ của tôi", chieuHoc: s.chieuHoc, quyThoiGian: s.quyThoiGian, cheDo: s.cheDo,
      batDauAt: s.batDauAt, hetGioAt: s.hetGioAt, ketThucAt: s.ketThucAt || null, trangThai: s.trangThai, muiGio: s.muiGio,
      hangDoi: s.hangDoi.map((h) => {
        const x = cardById(h.theId);
        const p = progressOf(u.id, h.theId, s.chieuHoc);
        return { theId: h.theId, thuTu: h.thuTu, trangThai: h.trangThai, tienDo: progressView(p), duKien: previewOf(p, t, s.muiGio), the: x ? theView(x) : null };
      }),
      tongKet: s.tongKet || null
    };
  }

  function summaryOf(s, u) {
    const t = Date.now();
    const rs = db.reviews.filter((r) => r.phienId === s.id);
    const by = { QUEN: 0, KHO: 0, NHO: 0, DE: 0 };
    rs.forEach((r) => { by[r.danhGia]++; });
    const ids = [...new Set(rs.map((r) => r.theId))];
    const st = streakOf(u.id, s.muiGio);
    return {
      phienId: s.id, chieuHoc: s.chieuHoc, quyThoiGian: s.quyThoiGian, boTheTen: s.boTheId ? deckName(s.boTheId) : "Tất cả bộ của tôi",
      soLuot: rs.length, soThe: ids.length, soTheMoi: ids.filter((id) => { const first = rs.find((r) => r.theId === id); return first && first.truoc.trangThai === "MOI"; }).length,
      thoiGianGiay: Math.max(0, Math.round((Date.parse(s.ketThucAt) - Date.parse(s.batDauAt)) / 1000)),
      theoDanhGia: by,
      tuCanLuyen: ids.filter((id) => rs.some((r) => r.theId === id && (r.danhGia === "QUEN" || r.danhGia === "KHO"))).map((id) => {
        const x = cardById(id);
        return x && { theId: id, tu: x.word, tuLoai: x.pos, nghiaVi: x.meaningVi, danhGia: rs.filter((r) => r.theId === id).map((r) => r.danhGia) };
      }).filter(Boolean),
      lichTiepTheo: ids.map((id) => {
        const x = cardById(id);
        const p = progressOf(u.id, id, s.chieuHoc);
        return x && { theId: id, tu: x.word, trangThai: p.trangThai, hanOnAt: p.hanOnAt, khoangHienThi: intervalLabel(t, p.hanOnAt, s.muiGio) };
      }).filter(Boolean).sort((a, b) => Date.parse(a.hanOnAt) - Date.parse(b.hanOnAt)),
      chuoiNgay: st.chuoiNgay, homNayDaTinhChuoi: st.homNayDaTinh, luotToiThieuChuoi: 5
    };
  }

  const PRACTICE_TYPES = ["CHON_NGHIA", "CHON_TU", "GHEP_TU", "DIEN_CHO_TRONG", "NHAP_TU_THEO_NGHIA", "NGHE_VIET", "PHAN_BIET_CAP", "TONG_HOP"];
  const SKILL_OF = { CHON_NGHIA: "NHAN_NGHIA", CHON_TU: "NHAN_NGHIA", GHEP_TU: "NHAN_NGHIA", DIEN_CHO_TRONG: "NGU_CANH", NHAP_TU_THEO_NGHIA: "VIET", NGHE_VIET: "NGHE", PHAN_BIET_CAP: "CAP_NHAM" };
  const SKILLS = ["NHAN_NGHIA", "VIET", "NGHE", "NGU_CANH", "CAP_NHAM"];

  function shuffle(a) { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = r[i]; r[i] = r[j]; r[j] = tmp; } return r; }
  const answerNorm = (s) => (s || "").toString().normalize("NFC").replace(/[’‘`]/g, "'").trim().replace(/\s+/g, " ").toLowerCase();
  function editDistance(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i].concat(Array(b.length).fill(0)));
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return dp[a.length][b.length];
  }
  function blankOf(x) {
    const s = x.exampleEn || "";
    const w = x.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = s.match(new RegExp("\\b(" + w + "[a-z]*)", "i"));
    if (!m) return null;
    return { cau: s.slice(0, m.index) + "_____" + s.slice(m.index + m[1].length), dapAn: m[1] };
  }
  function pairsOf(uid) {
    return db.pairs.filter((p) => p.uid === uid && cardById(p.the1Id) && cardById(p.the2Id));
  }
  function makeQuestion(type, x, distract, uid, thuTu) {
    const id = "q" + nextId();
    const base = { id, thuTu, loaiCau: type, theId: x.id, _snap: explain(x) };
    if (type === "CHON_NGHIA" || type === "CHON_TU") {
      const others = shuffle(distract.filter((y) => y.id !== x.id && strip(y.word) !== strip(x.word) && strip(y.meaningVi) !== strip(x.meaningVi))).slice(0, 3);
      if (others.length < 3) return null;
      const opts = shuffle([x].concat(others)).map((y, i) => ({ id: "o" + (i + 1), noiDung: type === "CHON_NGHIA" ? y.meaningVi : y.word, theId: y.id }));
      return Object.assign(base, {
        deBai: type === "CHON_NGHIA" ? { tu: x.word, phienAm: x.ipa, tuLoai: x.pos } : { nghiaVi: x.meaningVi, tuLoai: x.pos },
        phuongAn: opts.map((o) => ({ id: o.id, noiDung: o.noiDung })), _opts: opts,
        dapAn: { luaChonId: opts.find((o) => o.theId === x.id).id, noiDung: type === "CHON_NGHIA" ? x.meaningVi : x.word }
      });
    }
    if (type === "DIEN_CHO_TRONG") {
      const bl = blankOf(x);
      if (!bl) return null;
      return Object.assign(base, { deBai: { cau: bl.cau, goiY: x.meaningVi, tuLoai: x.pos }, dapAn: { chapNhan: [bl.dapAn], noiDung: bl.dapAn } });
    }
    if (type === "NHAP_TU_THEO_NGHIA") return Object.assign(base, { deBai: { nghiaVi: x.meaningVi, tuLoai: x.pos, viDuVi: x.exampleVi || null }, dapAn: { chapNhan: [x.word], noiDung: x.word } });
    if (type === "NGHE_VIET") return Object.assign(base, { deBai: { amThanhUrl: "demo-audio://" + id, tuLoai: x.pos }, dapAn: { chapNhan: [x.word], noiDung: x.word } });
    return null;
  }
  function matchQuestion(group, thuTu) {
    const left = shuffle(group).map((y, i) => ({ id: "t" + (i + 1), noiDung: y.word, theId: y.id }));
    const right = shuffle(group).map((y, i) => ({ id: "n" + (i + 1), noiDung: y.meaningVi, theId: y.id }));
    return {
      id: "q" + nextId(), thuTu, loaiCau: "GHEP_TU", theIds: group.map((y) => y.id),
      deBai: { cotTrai: left.map((o) => ({ id: o.id, noiDung: o.noiDung })), cotPhai: right.map((o) => ({ id: o.id, noiDung: o.noiDung })) },
      _left: left, _right: right,
      dapAn: { cap: left.map((l) => ({ traiId: l.id, phaiId: right.find((r) => r.theId === l.theId).id })) }
    };
  }
  function pairQuestion(target, other, thuTu, pairId) {
    const bl = blankOf(target);
    const opts = shuffle([target, other]).map((y, i) => ({ id: "o" + (i + 1), noiDung: y.word, theId: y.id }));
    return {
      id: "q" + nextId(), thuTu, loaiCau: "PHAN_BIET_CAP", theId: target.id, capId: pairId, _snap: explain(target), _other: explain(other),
      deBai: bl ? { cau: bl.cau, goiY: null } : { cau: null, goiY: target.meaningVi },
      phuongAn: opts.map((o) => ({ id: o.id, noiDung: o.noiDung })), _opts: opts,
      dapAn: { luaChonId: opts.find((o) => o.theId === target.id).id, noiDung: bl ? bl.dapAn : target.word, chapNhan: [target.word] }
    };
  }
  function publicQuestion(q) {
    return { id: q.id, thuTu: q.thuTu, loaiCau: q.loaiCau, deBai: q.deBai, phuongAn: q.phuongAn || null };
  }
  function notebookCardIds(uid) {
    return notebookItems(uid).map((i) => i.theId);
  }
  function createPractice(u, b, t) {
    const errors = [];
    if (!PRACTICE_TYPES.includes(b.loaiBai)) errors.push(fe("loaiBai", "Chọn dạng bài"));
    if (![5, 10, 20].includes(Number(b.soCau))) errors.push(fe("soCau", "Chọn 5, 10 hoặc 20 câu"));
    if (errors.length) bad(errors);
    if (b.boTheId) { const own = db.decks.find((d) => d.id === b.boTheId); if (!own || own.ownerId !== u.id || own.deleted) notFound(); }
    const usable = (x) => !DIRS.every((d) => progressOf(u.id, x.id, d).trangThai === "TAM_NGUNG");
    const distract = ownCards(u.id).filter(usable);
    let pool;
    if (Array.isArray(b.theIds) && b.theIds.length) pool = b.theIds.map(cardById).filter((x) => x && distract.includes(x));
    else if (b.nguon === "SO_TAY") pool = notebookCardIds(u.id).map(cardById).filter((x) => x && distract.includes(x));
    else pool = b.boTheId ? distract.filter((x) => x.deckId === b.boTheId) : distract;
    if (!pool.length) throw new ApiError(422, "BUSINESS_RULE", b.nguon === "SO_TAY" ? "Sổ tay đang trống, chưa có từ nào để luyện." : "Chưa có thẻ nào để luyện. Thêm thẻ vào bộ trước.");
    const n = Number(b.soCau);
    const qs = [];
    const order = shuffle(pool);
    if (b.loaiBai === "PHAN_BIET_CAP") {
      const pairs = pairsOf(u.id).filter((p) => !Array.isArray(b.theIds) || !b.theIds.length || (b.theIds.includes(p.the1Id) && b.theIds.includes(p.the2Id)));
      if (!pairs.length) throw new ApiError(422, "BUSINESS_RULE", "Bạn chưa có cặp từ dễ nhầm. Cặp được ghi nhận khi bạn chọn nhầm giữa hai từ trong bài luyện.");
      shuffle(pairs).forEach((p) => {
        const a = cardById(p.the1Id);
        const c2 = cardById(p.the2Id);
        [[a, c2], [c2, a]].forEach(([x, y]) => { if (qs.length < n) qs.push(pairQuestion(x, y, qs.length + 1, p.id)); });
      });
    } else if (b.loaiBai === "GHEP_TU") {
      if (distract.length < 3) throw new ApiError(422, "BUSINESS_RULE", "Cần ít nhất 3 thẻ để làm bài ghép từ.");
      const chosen = order.slice(0, n);
      for (let i = 0; i < chosen.length; i += 5) {
        let group = chosen.slice(i, i + 5);
        if (group.length < 3) group = group.concat(shuffle(distract.filter((x) => !group.includes(x))).slice(0, 3 - group.length));
        qs.push(matchQuestion(group, qs.length + 1));
      }
    } else {
      if ((b.loaiBai === "CHON_NGHIA" || b.loaiBai === "CHON_TU" || b.loaiBai === "TONG_HOP") && distract.length < 4) throw new ApiError(422, "BUSINESS_RULE", "Cần ít nhất 4 thẻ trong các bộ của bạn để tạo phương án nhiễu.");
      const mix = ["CHON_NGHIA", "DIEN_CHO_TRONG", "NGHE_VIET", "CHON_TU", "NHAP_TU_THEO_NGHIA"];
      const types = b.loaiBai === "TONG_HOP" ? mix : [b.loaiBai];
      const pairs = b.loaiBai === "TONG_HOP" ? pairsOf(u.id) : [];
      order.forEach((x, i) => {
        if (qs.length >= n) return;
        const wanted = Array.isArray(b.loaiCau) && b.loaiCau[i] ? [b.loaiCau[i]] : types;
        for (let k = 0; k < wanted.length; k++) {
          const type = wanted[(i + k) % wanted.length];
          const q = makeQuestion(type, x, distract, u.id, qs.length + 1);
          if (q) { qs.push(q); return; }
        }
      });
      if (b.loaiBai === "TONG_HOP" && pairs.length && qs.length < n) {
        const p = pairs[0];
        qs.push(pairQuestion(cardById(p.the1Id), cardById(p.the2Id), qs.length + 1, p.id));
      }
    }
    if (!qs.length) throw new ApiError(422, "BUSINESS_RULE", b.loaiBai === "DIEN_CHO_TRONG" ? "Các thẻ đã chọn chưa có câu ví dụ chứa đúng từ, nên chưa tạo được câu điền chỗ trống." : "Chưa tạo được câu hỏi từ các thẻ đã chọn.");
    const id = nextId();
    const s = { id, uid: u.id, loaiBai: b.loaiBai, boTheId: b.boTheId || null, nguon: b.nguon || "BO_THE", taoAt: iso(t), soCauYeuCau: n, cauHoi: qs, lanLamId: null, laLuyenLai: !!b.laLuyenLai };
    db.practice[id] = s;
    return s;
  }
  function practiceView(s) {
    const a = s.lanLamId ? db.attempts.find((x) => x.id === s.lanLamId) : null;
    return {
      id: s.id, loaiBai: s.loaiBai, boTheId: s.boTheId, boTheTen: s.boTheId ? deckName(s.boTheId) : (s.nguon === "SO_TAY" ? "Sổ tay từ khó" : "Tất cả bộ của tôi"), nguon: s.nguon,
      soCau: s.cauHoi.length, soCauYeuCau: s.soCauYeuCau, taoAt: s.taoAt, laLuyenLai: s.laLuyenLai, daNop: !!a, lanLamId: s.lanLamId,
      cauHoi: s.cauHoi.map(publicQuestion), ketQua: a ? attemptView(a) : null
    };
  }
  function attemptView(a) {
    return {
      lanLamId: a.id, baiLuyenId: a.baiLuyenId, loaiBai: a.loaiBai, boTheTen: a.boTheTen, soCauDung: a.soCauDung, tongSoCau: a.tongSoCau, diem: a.diem,
      thoiGianMs: a.thoiGianMs, nopAt: a.nopAt, laLuyenLai: a.laLuyenLai, theoKyNang: a.theoKyNang, ketQua: a.ketQua
    };
  }
  function explain(x, extra) {
    return Object.assign({ tu: x.word, phienAm: x.ipa, tuLoai: x.pos, nghiaVi: x.meaningVi, viDuEn: x.exampleEn || null, dichVi: x.exampleVi || null }, extra || {});
  }
  function addPair(uid, a, b2, t) {
    if (!a || !b2 || a === b2) return;
    const p = db.pairs.find((x) => x.uid === uid && ((x.the1Id === a && x.the2Id === b2) || (x.the1Id === b2 && x.the2Id === a)));
    if (p) { p.soLan++; p.ganNhatAt = iso(t); }
    else db.pairs.push({ id: "p" + nextId(), uid, the1Id: a, the2Id: b2, loaiNham: "NGHIA_GAN_NHAU", soLan: 1, ganNhatAt: iso(t) });
  }
  function submitPractice(u, s, b, t) {
    const given = {};
    (Array.isArray(b.traLoi) ? b.traLoi : []).forEach((r) => { if (r && r.cauHoiId) given[r.cauHoiId] = r; });
    const lanLamId = nextId();
    const results = s.cauHoi.map((q) => {
      const r = given[q.id] || {};
      let dung = false;
      let diem = 0;
      let nhomLoi = null;
      let traLoi = null;
      let giaiThich;
      if (q.loaiCau === "GHEP_TU") {
        const pairs = Array.isArray(r.cap) ? r.cap : [];
        const chiTiet = q.dapAn.cap.map((c) => {
          const got = pairs.find((pp) => pp.traiId === c.traiId);
          const lt = q._left.find((l) => l.id === c.traiId);
          const chosen = got ? q._right.find((rr) => rr.id === got.phaiId) : null;
          const ok = !!got && got.phaiId === c.phaiId;
          if (!ok && chosen) addPair(u.id, lt.theId, chosen.theId, t);
          return { traiId: c.traiId, tu: lt.noiDung, phaiIdDaChon: got ? got.phaiId : null, nghiaDaChon: chosen ? chosen.noiDung : null, nghiaDung: q._right.find((rr) => rr.id === c.phaiId).noiDung, dung: ok, theId: lt.theId };
        });
        const good = chiTiet.filter((c) => c.dung).length;
        diem = good / chiTiet.length;
        dung = good === chiTiet.length;
        nhomLoi = dung ? null : "NGHIA";
        traLoi = { cap: pairs };
        giaiThich = { cap: chiTiet };
        chiTiet.filter((c) => !c.dung).forEach((c) => db.errors.push({ uid: u.id, theId: c.theId, nhomLoi: "NGHIA", nguon: "BAI_LUYEN", createdAt: iso(t), bangChung: { traLoi: c.nghiaDaChon, dapAn: c.nghiaDung, lanLamId } }));
      } else if (q.phuongAn) {
        traLoi = { luaChonId: r.luaChonId || null };
        dung = r.luaChonId === q.dapAn.luaChonId;
        const chosen = q._opts.find((o) => o.id === r.luaChonId);
        if (!dung) {
          nhomLoi = q.loaiCau === "PHAN_BIET_CAP" ? "CAP_NHAM" : "NGHIA";
          if (chosen) addPair(u.id, q.theId, chosen.theId, t);
        }
        giaiThich = Object.assign({}, q._snap, q._other ? { soSanh: [{ tu: q._snap.tu, nghiaVi: q._snap.nghiaVi }, { tu: q._other.tu, nghiaVi: q._other.nghiaVi }] } : {});
        traLoi.noiDung = chosen ? chosen.noiDung : null;
      } else {
        const text = (r.noiDung || "").toString().slice(0, 200);
        traLoi = { noiDung: text };
        const got = answerNorm(text);
        dung = !!got && q.dapAn.chapNhan.some((a) => answerNorm(a) === got);
        if (!dung) {
          const near = got && editDistance(got, answerNorm(q.dapAn.noiDung)) <= 2;
          nhomLoi = near ? "CHINH_TA" : q.loaiCau === "NGHE_VIET" ? "NGHE" : q.loaiCau === "DIEN_CHO_TRONG" ? "NGU_CANH" : "NGHIA";
        }
        giaiThich = Object.assign({}, q._snap);
      }
      if (q.loaiCau !== "GHEP_TU") diem = dung ? 1 : 0;
      if (!dung && q.loaiCau !== "GHEP_TU") db.errors.push({ uid: u.id, theId: q.theId, nhomLoi, nguon: "BAI_LUYEN", createdAt: iso(t), bangChung: { traLoi: traLoi.noiDung || null, dapAn: q.dapAn.noiDung, lanLamId } });
      db.answers.push({ uid: u.id, lanLamId, kyNang: SKILL_OF[q.loaiCau], dung, lanDau: !s.laLuyenLai, createdAt: iso(t), theId: q.theId || null });
      return { cauHoiId: q.id, thuTu: q.thuTu, loaiCau: q.loaiCau, deBai: q.deBai, phuongAn: q.phuongAn || null, traLoi, dapAn: { luaChonId: q.dapAn.luaChonId || null, noiDung: q.dapAn.noiDung || null, cap: q.dapAn.cap || null }, dung, diem, nhomLoi, giaiThich, theId: q.theId || null, theIds: q.theIds || null };
    });
    const bySkill = {};
    results.forEach((r) => { const k = SKILL_OF[r.loaiCau]; bySkill[k] = bySkill[k] || { kyNang: k, dung: 0, tong: 0 }; bySkill[k].tong++; if (r.dung) bySkill[k].dung++; });
    const good = results.filter((r) => r.dung).length;
    const a = {
      id: lanLamId, uid: u.id, baiLuyenId: s.id, loaiBai: s.loaiBai, boTheId: s.boTheId, boTheTen: s.boTheId ? deckName(s.boTheId) : (s.nguon === "SO_TAY" ? "Sổ tay từ khó" : "Tất cả bộ của tôi"),
      submitKey: b.submitKey, soCauDung: good, tongSoCau: results.length, diem: Math.round(results.reduce((acc, r) => acc + r.diem, 0) / results.length * 100),
      thoiGianMs: Math.max(0, Math.min(Number(b.thoiGianMs) || 0, 3 * 3600000)), nopAt: iso(t), laLuyenLai: s.laLuyenLai, theoKyNang: Object.values(bySkill), ketQua: results
    };
    db.attempts.push(a);
    s.lanLamId = a.id;
    return a;
  }

  function notebookItems(uid, filter) {
    const map = {};
    const nb = db.notebook[uid] || {};
    const touch = (theId) => {
      const x = cardById(theId);
      if (!x) return null;
      const deck = db.decks.find((d) => d.id === x.deckId);
      if (!deck || deck.deleted || deck.ownerId !== uid) return null;
      return map[theId] = map[theId] || { theId, tu: x.word, tuLoai: x.pos, phienAm: x.ipa, nghiaVi: x.meaningVi, boTheId: x.deckId, boTheTen: deck.name, nhomLoi: {}, lyDo: [], bangChung: [], soLanQuen: 0, ghiChu: "", danhDauThuCong: false, lanGanNhatAt: null };
    };
    const hiddenAt = (theId) => (nb[theId] && nb[theId].anTu) || null;
    db.errors.filter((e) => e.uid === uid).forEach((e) => {
      const h = hiddenAt(e.theId);
      if (h && Date.parse(e.createdAt) <= Date.parse(h)) return;
      const it = touch(e.theId);
      if (!it) return;
      it.nhomLoi[e.nhomLoi] = (it.nhomLoi[e.nhomLoi] || 0) + 1;
      it.bangChung.push({ nhomLoi: e.nhomLoi, traLoi: e.bangChung.traLoi, dapAn: e.bangChung.dapAn, lanLamId: e.bangChung.lanLamId, baiLuyenId: (db.attempts.find((a) => a.id === e.bangChung.lanLamId) || {}).baiLuyenId || null, createdAt: e.createdAt });
      if (!it.lanGanNhatAt || e.createdAt > it.lanGanNhatAt) it.lanGanNhatAt = e.createdAt;
    });
    Object.keys(db.progress).filter((k) => k.startsWith(uid + "|")).forEach((k) => {
      const p = db.progress[k];
      const theId = k.split("|")[1];
      if (p.soLanQuen < 3 || p.trangThai === "TAM_NGUNG") return;
      const h = hiddenAt(theId);
      if (h) return;
      const it = touch(theId);
      if (!it) return;
      it.soLanQuen = Math.max(it.soLanQuen, p.soLanQuen);
    });
    Object.keys(nb).forEach((theId) => {
      const n = nb[theId];
      if (!n.danhDauThuCong && !n.ghiChu) return;
      if (!n.danhDauThuCong && !map[theId]) return;
      const it = touch(theId);
      if (!it) return;
      it.ghiChu = n.ghiChu || "";
      it.danhDauThuCong = !!n.danhDauThuCong;
      if (n.capNhatAt && (!it.lanGanNhatAt || n.capNhatAt > it.lanGanNhatAt)) it.lanGanNhatAt = n.capNhatAt;
    });
    let list = Object.values(map).map((it) => {
      if (it.soLanQuen >= 3) it.lyDo.push("QUEN_NHIEU");
      if ((it.nhomLoi.CHINH_TA || 0) >= 2) it.lyDo.push("SAI_CHINH_TA");
      if (it.nhomLoi.CAP_NHAM) it.lyDo.push("CAP_DE_NHAM");
      if (it.danhDauThuCong) it.lyDo.push("DANH_DAU_THU_CONG");
      it.nhomLoi = Object.keys(it.nhomLoi).map((k) => ({ nhomLoi: k, soLan: it.nhomLoi[k] }));
      it.bangChung = it.bangChung.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3);
      return it;
    });
    if (filter) list = list.filter((it) => filter === "DANH_DAU" ? it.danhDauThuCong : filter === "QUEN_NHIEU" ? it.soLanQuen >= 3 : it.nhomLoi.some((g) => g.nhomLoi === filter));
    return list.sort((a, b) => (b.lanGanNhatAt || "").localeCompare(a.lanGanNhatAt || ""));
  }

  function skillStats(uid, deckId) {
    return SKILLS.map((k) => {
      let all = db.answers.filter((a) => a.uid === uid && a.kyNang === k);
      if (deckId) all = all.filter((a) => { const x = a.theId && cardById(a.theId); return x && x.deckId === deckId; });
      all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const recent = all.slice(0, 20);
      let w = 0;
      let s = 0;
      recent.forEach((a, i) => { const wi = 20 - i; w += wi; if (a.dung) s += wi; });
      const first = all.filter((a) => a.lanDau);
      const retry = all.filter((a) => !a.lanDau);
      const rate = (list) => list.length ? Math.round(list.filter((a) => a.dung).length / list.length * 100) : null;
      const enough = recent.length >= 5;
      return { kyNang: k, soQuanSat: all.length, soLuotTinh: recent.length, duDuLieu: enough, mucLamChu: enough ? Math.round(s / w * 100) : null, tyLeDungLanDau: rate(first), tyLeDungSauLuyenLai: rate(retry), soQuanSatToiThieu: 5, nguon: "BAI_LUYEN" };
    });
  }

  function audit(u, hanhDong, doiTuong, lyDo, truoc, sau) {
    db.audit.push({ id: "a" + nextId(), nguoiThucHien: { id: u.id, tenHienThi: u.tenHienThi }, hanhDong, doiTuong, lyDo: lyDo || null, truoc: truoc || null, sau: sau || null, createdAt: new Date().toISOString() });
  }
  function adminUserView(u) {
    return { id: u.id, email: u.email, tenHienThi: u.tenHienThi, trangThai: u.trangThai, vaiTro: u.vaiTro, createdAt: u.createdAt, dangNhapCuoiAt: u.dangNhapCuoiAt, soBoThe: db.decks.filter((d) => d.ownerId === u.id && !d.deleted).length };
  }
  const activeAdmins = () => db.users.filter((x) => x.vaiTro.includes("ADMIN") && x.trangThai === "HOAT_DONG");
  function needReason(v) {
    const r = reason(v);
    if (r.length < 10 || r.length > 500) bad([fe("lyDo", "Nhập lý do từ 10 đến 500 ký tự")]);
    return r;
  }
  function adminDeckView(d) {
    return {
      id: d.id, ten: d.name, moTa: d.description, mucTieu: d.goal, chuDeId: d.topicId, chuDeTen: topicName(d.topicId), trinhDo: d.level, quyenTruyCap: d.visibility,
      trangThaiKiemDuyet: d.trangThaiKiemDuyet || "BINH_THUONG", soThe: db.cards.filter((x) => x.deckId === d.id).length,
      soBanSao: db.decks.filter((x) => x.sourceDeckId === d.id && !x.deleted).length, updatedAt: d.updatedAt, version: d.version
    };
  }
  function sampleDeck(id) {
    const d = db.decks.find((x) => x.id === id && x.kind === "MAU" && !x.deleted);
    if (!d) notFound();
    return d;
  }
  function validateAdminDeck(b, partial) {
    const errors = [];
    const has = (k) => !partial || b[k] !== undefined;
    if (has("ten")) { const n = reason(b.ten); if (!n) errors.push(fe("ten", "Nhập tên bộ")); else if (n.length > 150) errors.push(fe("ten", "Tên bộ tối đa 150 ký tự")); }
    if (has("moTa") && (b.moTa || "").length > 1000) errors.push(fe("moTa", "Mô tả tối đa 1000 ký tự"));
    if (has("mucTieu") && !["GIAO_TIEP", "TOEIC"].includes(b.mucTieu)) errors.push(fe("mucTieu", "Chọn mục tiêu"));
    if (has("chuDeId") && !db.topics.some((t) => t.id === b.chuDeId)) errors.push(fe("chuDeId", "Chọn chủ đề"));
    if (has("trinhDo") && !["MOI_BAT_DAU", "CO_BAN", "TRUNG_CAP", "NANG_CAO"].includes(b.trinhDo)) errors.push(fe("trinhDo", "Chọn trình độ"));
    if (errors.length) bad(errors);
  }
  function validateAdminCard(b, partial) {
    const errors = [];
    const has = (k) => !partial || b[k] !== undefined;
    if (has("tu")) { const v = reason(b.tu); if (!v) errors.push(fe("tu", "Nhập từ hoặc cụm từ tiếng Anh")); else if (v.length > 100) errors.push(fe("tu", "Từ tối đa 100 ký tự")); }
    if (has("nghiaVi")) { const v = reason(b.nghiaVi); if (!v) errors.push(fe("nghiaVi", "Nhập nghĩa tiếng Việt")); else if (v.length > 500) errors.push(fe("nghiaVi", "Nghĩa tối đa 500 ký tự")); }
    if (has("phienAm") && (b.phienAm || "").length > 100) errors.push(fe("phienAm", "Phiên âm tối đa 100 ký tự"));
    if (has("tuLoai") && (b.tuLoai || "").length > 30) errors.push(fe("tuLoai", "Từ loại tối đa 30 ký tự"));
    if (has("viDuEn") && (b.viDuEn || "").length > 300) errors.push(fe("viDuEn", "Ví dụ tối đa 300 ký tự"));
    if (has("dichVi") && (b.dichVi || "").length > 300) errors.push(fe("dichVi", "Bản dịch tối đa 300 ký tự"));
    if (errors.length) bad(errors);
  }
  function dateRange(q, tz) {
    const today = localDate(Date.now(), tz);
    const re = /^\d{4}-\d{2}-\d{2}$/;
    const den = q.denNgay || today;
    const tu = q.tuNgay || localDate(Date.parse(den + "T12:00:00Z") - 6 * DAY, tz);
    const errors = [];
    if (!re.test(tu)) errors.push(fe("tuNgay", "Ngày bắt đầu không hợp lệ"));
    if (!re.test(den)) errors.push(fe("denNgay", "Ngày kết thúc không hợp lệ"));
    if (!errors.length && tu > den) errors.push(fe("tuNgay", "Ngày bắt đầu phải trước ngày kết thúc"));
    if (!errors.length && (Date.parse(den) - Date.parse(tu)) / DAY > 89) errors.push(fe("tuNgay", "Chọn khoảng tối đa 90 ngày"));
    if (errors.length) bad(errors);
    const list = [];
    for (let d = Date.parse(tu + "T12:00:00Z"); d <= Date.parse(den + "T12:00:00Z"); d += DAY) list.push(new Date(d).toISOString().slice(0, 10));
    return { tu, den, list };
  }

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
      if (!email) errors.push(fe("email", "Vui lòng nhập email"));
      else if (!EMAIL_RE.test(email) || email.length > 255) errors.push(fe("email", "Email không hợp lệ"));
      if (!b.password) errors.push(fe("password", "Vui lòng nhập mật khẩu"));
      if (errors.length) bad(errors);
      const limiter = rateLimit("login:" + email, 5);
      const u = db.users.find((x) => x.email === email);
      if (!u || u.password !== b.password) { limiter.fail(); throw new ApiError(401, "INVALID_CREDENTIALS", "Sai email hoặc mật khẩu"); }
      if (u.trangThai === "CHUA_XAC_THUC") throw new ApiError(403, "EMAIL_NOT_VERIFIED", "Tài khoản chưa xác thực email");
      if (u.trangThai === "BI_KHOA" || u.trangThai === "DANG_XOA") throw new ApiError(403, "ACCOUNT_LOCKED", "Tài khoản đã bị khóa. Liên hệ với quản trị viên để được hỗ trợ");
      limiter.reset();
      session.set({ userId: u.id }, !!b.remember);
      return publicUser(u);
    }],
    ["POST", /^\/auth\/logout$/, () => { session.clear(); return { status: 204 }; }],
    ["POST", /^\/auth\/forgot-password$/, (m, b) => {
      if (!norm(b.email)) bad([fe("email", "Vui lòng nhập email")]);
      if (!EMAIL_RE.test(norm(b.email))) bad([fe("email", "Email không hợp lệ")]);
      rateLimit("forgot:" + norm(b.email), 3).fail();
      const u = db.users.find((x) => x.email === norm(b.email) && (x.trangThai === "HOAT_DONG" || x.trangThai === "CHUA_XAC_THUC"));
      if (u) db.tokens["reset-" + u.id] = { userId: u.id, type: "DAT_LAI_MAT_KHAU", used: false, expiresAt: Date.now() + 1800000 };
      return { status: 200, body: null };
    }],
    ["POST", /^\/auth\/reset-password$/, (m, b) => {
      if (!validPassword(b.password)) bad([fe("password", "Mật khẩu 8–72 ký tự, có chữ cái và chữ số")]);
      const t = db.tokens[b.token];
      if (!t || t.type !== "DAT_LAI_MAT_KHAU" || t.used || t.expiresAt < Date.now()) throw new ApiError(400, "TOKEN_INVALID", "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
      t.used = true;
      const u = db.users.find((x) => x.id === t.userId && (x.trangThai === "HOAT_DONG" || x.trangThai === "CHUA_XAC_THUC"));
      if (!u) throw new ApiError(400, "TOKEN_INVALID", "Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn");
      if (u.trangThai === "CHUA_XAC_THUC") u.trangThai = "HOAT_DONG";
      u.password = b.password;
      if (session.get() && session.get().userId === u.id) session.clear();
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
      return publicUser(u);
    }],
    ["PUT", /^\/me\/password$/, (m, b) => {
      const u = requireMe();
      const errors = [];
      if (!b.currentPassword) errors.push(fe("currentPassword", "Vui lòng nhập mật khẩu hiện tại"));
      if (!b.newPassword) errors.push(fe("newPassword", "Vui lòng nhập mật khẩu mới"));
      else if (!validPassword(b.newPassword)) errors.push(fe("newPassword", "Mật khẩu 8–72 ký tự, có chữ cái và chữ số"));
      if (errors.length) bad(errors);
      const limit = rateLimit("change-password:" + u.id, 5);
      if (b.currentPassword !== u.password) { limit.fail(); throw new ApiError(400, "VALIDATION_FAILED", "Mật khẩu hiện tại không đúng", [fe("currentPassword", "Mật khẩu hiện tại không đúng")]); }
      if (b.newPassword === b.currentPassword) throw new ApiError(400, "VALIDATION_FAILED", "Mật khẩu mới phải khác mật khẩu hiện tại", [fe("newPassword", "Mật khẩu mới phải khác mật khẩu hiện tại")]);
      limit.reset();
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
      const u = requireMe();
      const types = b.loai === "ANH" ? ["image/jpeg", "image/png", "image/webp"] : b.loai === "AM_THANH" ? ["audio/mpeg", "audio/wav", "audio/vnd.wave", "audio/flac", "audio/x-flac"] : [];
      if (!types.includes(b.mimeType) || !Number.isInteger(b.kichThuoc) || b.kichThuoc <= 0 || !/^[a-fA-F0-9]{64}$/.test(b.checksum || "")) bad([fe("file", "Loại, dung lượng hoặc SHA-256 không hợp lệ")]);
      if (b.kichThuoc > (b.loai === "ANH" ? 2 : 5) * 1024 * 1024) bad([fe("file", "Tệp vượt dung lượng cho phép")]);
      const id = nextId();
      db.files[id] = { id, ownerId: u.id, loai: b.loai, mimeType: b.mimeType, kichThuoc: b.kichThuoc, checksum: b.checksum.toLowerCase(), url: null, hoanTatAt: null };
      return { status: 201, body: { fileId: id, uploadUrl: "demo://upload/" + id, expiresAt: new Date(Date.now() + 600000).toISOString() } };
    }],
    ["POST", /^\/files\/(\w+)\/complete$/, (m) => {
      const f = ownedFile(m[1]);
      if (!f.url) throw new ApiError(422, "BUSINESS_RULE", "Tệp chưa được tải lên");
      f.hoanTatAt = f.hoanTatAt || new Date().toISOString();
      return fileResponse(f);
    }],
    ["GET", /^\/files\/(\w+)$/, (m) => fileResponse(ownedFile(m[1]))],
    ["DELETE", /^\/files\/(\w+)$/, (m) => {
      const u = requireMe(), f = ownedFile(m[1], true);
      f.deleted = true;
      if (u.anhDaiDienId === f.id) { u.anhDaiDienId = null; u.anhDaiDienUrl = null; }
      return { status: 204 };
    }],
    ["PUT", /^\/me\/avatar$/, (m, b) => {
      const u = requireMe();
      if (!/^[1-9][0-9]{0,17}$/.test(b.anhDaiDienId || "")) bad([fe("anhDaiDienId", "ID ảnh không hợp lệ")]);
      const f = ownedFile(b.anhDaiDienId);
      if (f.loai !== "ANH" || !f.hoanTatAt) throw new ApiError(422, "BUSINESS_RULE", "Ảnh đại diện phải là tệp ảnh đã hoàn tất");
      u.anhDaiDienId = f.id; u.anhDaiDienUrl = f.url;
      return fileResponse(f);
    }],
    ["GET", /^\/me\/avatar$/, () => {
      const u = requireMe();
      return u.anhDaiDienId ? fileResponse(ownedFile(u.anhDaiDienId)) : { status: 204 };
    }],
    ["DELETE", /^\/me\/avatar$/, () => {
      const u = requireMe(); u.anhDaiDienId = null; u.anhDaiDienUrl = null;
      return { status: 204 };
    }],

    ["GET", /^\/public\/topics$/, () => db.topics.map((t) => Object.assign({}, t, { deckCount: db.decks.filter((d) => d.topicId === t.id && d.visibility === "CONG_KHAI" && !d.deleted && d.trangThaiKiemDuyet !== "DA_AN").length }))],
    ["GET", /^\/public\/tags$/, () => db.tags],

    ["GET", /^\/library\/decks$/, (m, b, q) => {
      const u = me();
      let list = db.decks.filter((d) => d.visibility === "CONG_KHAI" && !d.deleted && d.trangThaiKiemDuyet !== "DA_AN");
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
      const d = db.decks.find((x) => x.id === m[1] && x.visibility === "CONG_KHAI" && !x.deleted && x.trangThaiKiemDuyet !== "DA_AN");
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
    ["DELETE", /^\/admin\/tags\/(\w+)$/, (m) => { requireAdmin(); db.tags = db.tags.filter((x) => x.id !== m[1]); db.cards.forEach((x) => { x.tagIds = (x.tagIds || []).filter((t) => t !== m[1]); }); return { status: 204 }; }],

    ["GET", /^\/learning\/today$/, (m, b, q) => todayPlan(requireMe(), q)],
    ["POST", /^\/learning\/sessions$/, (m, b) => {
      const u = requireMe();
      const errors = [];
      if (!DIRS.includes(b.chieuHoc)) errors.push(fe("chieuHoc", "Chọn chiều học Anh → Việt hoặc Việt → Anh"));
      if (![5, 10, 20].includes(Number(b.quyThoiGian))) errors.push(fe("quyThoiGian", "Chọn 5, 10 hoặc 20 phút"));
      if (b.cheDo && !["THUONG", "CUU_LICH"].includes(b.cheDo)) errors.push(fe("cheDo", "Chế độ học không hợp lệ"));
      if (errors.length) bad(errors);
      if (b.boTheId) ownDeck(b.boTheId);
      const mode = b.cheDo || "THUONG";
      const queue = buildQueue(u, b.boTheId || null, b.chieuHoc, Number(b.quyThoiGian), mode);
      if (!queue.length) throw new ApiError(422, "BUSINESS_RULE", "Chưa có thẻ nào cần học lúc này ở chiều đã chọn. Thẻ đến hạn tiếp theo sẽ xuất hiện đúng giờ, hoặc thêm thẻ mới vào bộ.");
      const t = Date.now();
      const id = nextId();
      db.sessions[id] = { id, uid: u.id, boTheId: b.boTheId || null, chieuHoc: b.chieuHoc, quyThoiGian: Number(b.quyThoiGian), cheDo: mode, muiGio: tzOf(u), batDauAt: iso(t), hetGioAt: iso(t + Number(b.quyThoiGian) * MIN), trangThai: "DANG_HOC", hangDoi: queue.map((it, i) => ({ theId: it.x.id, thuTu: i + 1, trangThai: "CHO" })) };
      return { status: 201, body: sessionView(db.sessions[id], u) };
    }],
    ["GET", /^\/learning\/sessions\/(\w+)$/, (m) => {
      const u = requireMe();
      const s = db.sessions[m[1]];
      if (!s || s.uid !== u.id) notFound();
      return sessionView(s, u);
    }],
    ["POST", /^\/learning\/sessions\/(\w+)\/reviews$/, (m, b) => {
      const u = requireMe();
      const s = db.sessions[m[1]];
      if (!s || s.uid !== u.id) notFound();
      const ek = u.id + "|" + b.clientEventId;
      if (b.clientEventId && db.events[ek]) return db.events[ek];
      const errors = [];
      if (!b.clientEventId || String(b.clientEventId).length > 64) errors.push(fe("clientEventId", "Thiếu mã sự kiện"));
      if (!RATINGS.includes(b.danhGia)) errors.push(fe("danhGia", "Chọn một trong bốn mức: Quên, Khó, Nhớ, Dễ"));
      if (b.chieuHoc !== s.chieuHoc) errors.push(fe("chieuHoc", "Chiều học không khớp với phiên"));
      if (typeof b.expectedVersion !== "number") errors.push(fe("expectedVersion", "Thiếu phiên bản tiến độ"));
      if (errors.length) bad(errors);
      if (s.trangThai !== "DANG_HOC") throw new ApiError(409, "CONFLICT", "Phiên học đã kết thúc. Các kết quả đã lưu vẫn được giữ.");
      const h = s.hangDoi.find((x) => x.theId === b.theId && x.trangThai === "CHO");
      if (!h) throw new ApiError(422, "BUSINESS_RULE", "Thẻ này không có trong hàng đợi của phiên");
      const t = Date.now();
      const tz = s.muiGio;
      let p = progressOf(u.id, b.theId, s.chieuHoc);
      if (flags.conflictOnce) {
        flags.conflictOnce = false;
        const other = srsNext(p, "NHO", t - 2000, tz);
        other.version = p.version + 1;
        db.reviews.push({ id: nextId(), uid: u.id, clientEventId: "tab-khac-" + nextId(), phienId: "tab-khac", theId: b.theId, chieuHoc: s.chieuHoc, danhGia: "NHO", thoiGianTraLoiMs: 6000, createdAt: iso(t - 2000), truoc: progressView(p), sau: progressView(other), phienBanThuatToan: ALGO });
        setProgress(u.id, b.theId, s.chieuHoc, other);
        p = other;
      }
      if (b.expectedVersion !== p.version) throw new ApiError(409, "VERSION_CONFLICT", "Thẻ này vừa được chấm ở một tab khác. Đã tải trạng thái mới nhất.", [], { tienDo: progressView(p), duKien: previewOf(p, t, tz) });
      const phys = physicallyNew(u.id, b.theId);
      const truoc = progressView(p);
      const n = srsNext(p, b.danhGia, t, tz);
      n.version = p.version + 1;
      setProgress(u.id, b.theId, s.chieuHoc, n);
      const ms = Math.max(0, Math.min(Number(b.thoiGianTraLoiMs) || 0, 120000));
      db.reviews.push({ id: nextId(), uid: u.id, clientEventId: b.clientEventId, phienId: s.id, theId: b.theId, chieuHoc: s.chieuHoc, danhGia: b.danhGia, thoiGianTraLoiMs: ms, createdAt: iso(t), truoc, sau: progressView(n), phienBanThuatToan: ALGO });
      const us = usageOf(u.id, localDate(t, tz));
      us.soLuotHopLe++;
      if (phys) us.soTheMoi++;
      h.trangThai = "DA_ON";
      const again = (n.trangThai === "DANG_HOC" || n.trangThai === "HOC_LAI") && Date.parse(n.hanOnAt) <= Date.parse(s.hetGioAt);
      if (again) s.hangDoi.push({ theId: b.theId, thuTu: s.hangDoi.length + 1, trangThai: "CHO" });
      const res = { clientEventId: b.clientEventId, theId: b.theId, chieuHoc: s.chieuHoc, danhGia: b.danhGia, truoc, tienDo: progressView(n), khoangHienThi: intervalLabel(t, n.hanOnAt, tz), laiTrongPhien: again, duKien: again ? previewOf(n, t, tz) : null };
      db.events[ek] = res;
      return { status: 201, body: res };
    }],
    ["POST", /^\/learning\/sessions\/(\w+)\/finish$/, (m) => {
      const u = requireMe();
      const s = db.sessions[m[1]];
      if (!s || s.uid !== u.id) notFound();
      if (s.trangThai === "DANG_HOC") {
        s.trangThai = "DA_KET_THUC";
        s.ketThucAt = new Date().toISOString();
        s.tongKet = summaryOf(s, u);
      }
      return s.tongKet;
    }],
    ["GET", /^\/learning\/history$/, (m, b, q) => {
      const u = requireMe();
      let list = db.reviews.filter((r) => r.uid === u.id && cardById(r.theId));
      if (q.boTheId) { ownDeck(q.boTheId); list = list.filter((r) => cardById(r.theId).deckId === q.boTheId); }
      if (q.theId) list = list.filter((r) => r.theId === q.theId);
      if (q.phienId) list = list.filter((r) => r.phienId === q.phienId);
      const items = list.slice().sort((a, c2) => c2.createdAt.localeCompare(a.createdAt)).map((r) => {
        const x = cardById(r.theId);
        return { id: r.id, createdAt: r.createdAt, phienId: r.phienId, theId: r.theId, tu: x.word, chieuHoc: r.chieuHoc, danhGia: r.danhGia, thoiGianTraLoiMs: r.thoiGianTraLoiMs, truoc: { trangThai: r.truoc.trangThai }, sau: { trangThai: r.sau.trangThai, hanOnAt: r.sau.hanOnAt || null }, phienBanThuatToan: r.phienBanThuatToan };
      });
      return page(items, Object.assign({ size: "20" }, q));
    }],
    ["GET", /^\/decks\/(\w+)\/progress$/, (m, b, q) => {
      const { u, d } = ownDeck(m[1]);
      const tz = tzOf(u);
      const t = Date.now();
      const sod = startOfLocalDay(t, tz);
      const eod = sod + DAY;
      const group = (p) => {
        if (p.trangThai === "TAM_NGUNG") return "TAM_NGUNG";
        if (p.trangThai === "MOI") return "MOI";
        const h = Date.parse(p.hanOnAt);
        if (h < sod) return "QUA_HAN";
        if (h < eod) return "DEN_HAN";
        return "DANG_HOC";
      };
      const tongHop = { MOI: 0, DANG_HOC: 0, DEN_HAN: 0, QUA_HAN: 0, TAM_NGUNG: 0 };
      let items = db.cards.filter((x) => x.deckId === d.id).map((x) => {
        const chieu = {};
        DIRS.forEach((dir) => { const p = progressOf(u.id, x.id, dir); const g = group(p); tongHop[g]++; chieu[dir] = Object.assign(progressView(p), { nhom: g, khoangHienThi: p.hanOnAt ? intervalLabel(t, p.hanOnAt, tz) : null }); });
        return { theId: x.id, tu: x.word, tuLoai: x.pos, phienAm: x.ipa, nghiaVi: x.meaningVi, tamNgung: DIRS.every((dir) => chieu[dir].trangThai === "TAM_NGUNG"), chieu };
      });
      if (q.nhom) items = items.filter((it) => DIRS.some((dir) => it.chieu[dir].nhom === q.nhom));
      if (q.q) { const k = strip(q.q); items = items.filter((it) => strip(it.tu).includes(k) || strip(it.nghiaVi).includes(k)); }
      return Object.assign({ boTheId: d.id, ten: d.name, tongHop, muiGio: tz }, page(items, Object.assign({ size: "20" }, q)));
    }],
    ["PUT", /^\/cards\/(\w+)\/progress\/suspend$/, (m, b) => {
      const card = cardById(m[1]);
      if (!card) notFound();
      const { u } = ownDeck(card.deckId);
      if (typeof b.tamNgung !== "boolean") bad([fe("tamNgung", "Thiếu trạng thái tạm ngưng")]);
      DIRS.forEach((dir) => {
        const p = progressOf(u.id, card.id, dir);
        if (b.tamNgung && p.trangThai !== "TAM_NGUNG") setProgress(u.id, card.id, dir, Object.assign({}, p, { trangThai: "TAM_NGUNG", truocTamNgung: { trangThai: p.trangThai, hanOnAt: p.hanOnAt }, version: p.version + 1 }));
        if (!b.tamNgung && p.trangThai === "TAM_NGUNG") {
          const prev = p.truocTamNgung || { trangThai: "MOI", hanOnAt: null };
          const n = Object.assign({}, p, { trangThai: prev.trangThai, hanOnAt: prev.hanOnAt, version: p.version + 1 });
          delete n.truocTamNgung;
          setProgress(u.id, card.id, dir, n);
        }
      });
      const out = {};
      DIRS.forEach((dir) => { out[dir] = progressView(progressOf(u.id, card.id, dir)); });
      return { theId: card.id, tamNgung: b.tamNgung, chieu: out };
    }],
    ["POST", /^\/cards\/(\w+)\/progress\/reset$/, (m) => {
      const card = cardById(m[1]);
      if (!card) notFound();
      const { u } = ownDeck(card.deckId);
      const out = {};
      DIRS.forEach((dir) => {
        const p = progressOf(u.id, card.id, dir);
        const n = Object.assign(newProgress(), { version: p.version + 1 });
        setProgress(u.id, card.id, dir, n);
        out[dir] = progressView(n);
      });
      return { theId: card.id, chieu: out };
    }],

    ["POST", /^\/practice\/sessions$/, (m, b) => {
      const u = requireMe();
      const s = createPractice(u, b, Date.now());
      return { status: 201, body: practiceView(s) };
    }],
    ["GET", /^\/practice\/sessions\/(\w+)$/, (m) => {
      const u = requireMe();
      const s = db.practice[m[1]];
      if (!s || s.uid !== u.id) notFound();
      return practiceView(s);
    }],
    ["POST", /^\/practice\/sessions\/(\w+)\/submissions$/, (m, b) => {
      const u = requireMe();
      const s = db.practice[m[1]];
      if (!s || s.uid !== u.id) notFound();
      if (!b.submitKey || String(b.submitKey).length > 64) bad([fe("submitKey", "Thiếu khóa nộp bài")]);
      const prior = db.attempts.find((a) => a.uid === u.id && a.submitKey === b.submitKey);
      if (prior) return attemptView(prior);
      if (s.lanLamId) throw new ApiError(409, "CONFLICT", "Bài này đã được nộp. Mở kết quả để xem đáp án.", [], { lanLamId: s.lanLamId });
      return { status: 201, body: attemptView(submitPractice(u, s, b, Date.now())) };
    }],
    ["POST", /^\/practice\/mistakes\/retry$/, (m, b) => {
      const u = requireMe();
      const a = db.attempts.find((x) => x.id === b.lanLamId && x.uid === u.id);
      if (!a) notFound();
      const wrong = a.ketQua.filter((r) => !r.dung);
      if (!wrong.length) throw new ApiError(422, "BUSINESS_RULE", "Bài này không có câu sai để luyện lại.");
      const theIds = [];
      const loaiCau = [];
      wrong.forEach((r) => { (r.theIds || [r.theId]).forEach((id) => { if (id && cardById(id) && !theIds.includes(id)) { theIds.push(id); loaiCau.push(r.loaiCau === "GHEP_TU" ? "CHON_NGHIA" : r.loaiCau); } }); });
      if (!theIds.length) throw new ApiError(422, "BUSINESS_RULE", "Các thẻ của câu sai đã bị xóa nên không luyện lại được.");
      const loaiBai = a.loaiBai === "GHEP_TU" ? "CHON_NGHIA" : a.loaiBai;
      const s = createPractice(u, { loaiBai, soCau: 20, theIds, loaiCau: loaiBai === "TONG_HOP" ? loaiCau : null, boTheId: null, nguon: "LUYEN_LAI", laLuyenLai: true }, Date.now());
      return { status: 201, body: practiceView(s) };
    }],
    ["GET", /^\/practice\/history$/, (m, b, q) => {
      const u = requireMe();
      let list = db.attempts.filter((a) => a.uid === u.id);
      if (q.loaiBai) list = list.filter((a) => a.loaiBai === q.loaiBai);
      const items = list.slice().sort((a, c2) => c2.nopAt.localeCompare(a.nopAt)).map((a) => ({ lanLamId: a.id, baiLuyenId: a.baiLuyenId, loaiBai: a.loaiBai, boTheTen: a.boTheTen, soCauDung: a.soCauDung, tongSoCau: a.tongSoCau, diem: a.diem, thoiGianMs: a.thoiGianMs, nopAt: a.nopAt, laLuyenLai: a.laLuyenLai, soCauSai: a.tongSoCau - a.soCauDung }));
      return page(items, Object.assign({ size: "10" }, q));
    }],

    ["GET", /^\/notebook$/, (m, b, q) => {
      const u = requireMe();
      const all = notebookItems(u.id);
      const tongHop = { TAT_CA: all.length, NGHIA: 0, CHINH_TA: 0, NGHE: 0, NGU_CANH: 0, CAP_NHAM: 0, QUEN_NHIEU: 0, DANH_DAU: 0 };
      all.forEach((it) => { it.nhomLoi.forEach((g) => { tongHop[g.nhomLoi] = (tongHop[g.nhomLoi] || 0) + 1; }); if (it.soLanQuen >= 3) tongHop.QUEN_NHIEU++; if (it.danhDauThuCong) tongHop.DANH_DAU++; });
      return Object.assign({ tongHop }, page(q.nhomLoi ? notebookItems(u.id, q.nhomLoi) : all, Object.assign({ size: "20" }, q)));
    }],
    ["PUT", /^\/notebook\/(\w+)$/, (m, b) => {
      const u = requireMe();
      const card = cardById(m[1]);
      if (!card) notFound();
      ownDeck(card.deckId);
      if ((b.ghiChu || "").length > 500) bad([fe("ghiChu", "Ghi chú tối đa 500 ký tự")]);
      const nb = db.notebook[u.id] = db.notebook[u.id] || {};
      const cur = nb[card.id] || {};
      nb[card.id] = { ghiChu: b.ghiChu !== undefined ? reason(b.ghiChu) : (cur.ghiChu || ""), danhDauThuCong: b.danhDauThuCong !== undefined ? !!b.danhDauThuCong : !!cur.danhDauThuCong, anTu: null, capNhatAt: new Date().toISOString() };
      return notebookItems(u.id).find((it) => it.theId === card.id) || { theId: card.id, ghiChu: nb[card.id].ghiChu, danhDauThuCong: nb[card.id].danhDauThuCong };
    }],
    ["DELETE", /^\/notebook\/(\w+)$/, (m) => {
      const u = requireMe();
      const card = cardById(m[1]);
      if (!card) notFound();
      ownDeck(card.deckId);
      const nb = db.notebook[u.id] = db.notebook[u.id] || {};
      nb[card.id] = Object.assign({}, nb[card.id] || {}, { danhDauThuCong: false, anTu: new Date().toISOString() });
      return { status: 204 };
    }],
    ["GET", /^\/learning\/confusing-pairs$/, () => {
      const u = requireMe();
      const v = (x) => ({ id: x.id, tu: x.word, tuLoai: x.pos, phienAm: x.ipa, nghiaVi: x.meaningVi, viDuEn: x.exampleEn });
      return pairsOf(u.id).sort((a, c2) => c2.soLan - a.soLan || c2.ganNhatAt.localeCompare(a.ganNhatAt)).map((p) => ({ id: p.id, the1: v(cardById(p.the1Id)), the2: v(cardById(p.the2Id)), loaiNham: p.loaiNham, soLan: p.soLan, ganNhatAt: p.ganNhatAt }));
    }],

    ["GET", /^\/statistics\/overview$/, (m, b, q) => {
      const u = requireMe();
      const tz = tzOf(u);
      const r = dateRange(q, tz);
      if (q.boTheId) ownDeck(q.boTheId);
      const inDeck = (theId) => { if (!q.boTheId) return true; const x = cardById(theId); return x && x.deckId === q.boTheId; };
      const rs = db.reviews.filter((x) => x.uid === u.id && inDeck(x.theId)).map((x) => Object.assign({ ngay: localDate(Date.parse(x.createdAt), tz) }, x)).filter((x) => x.ngay >= r.tu && x.ngay <= r.den);
      const as = db.attempts.filter((a) => a.uid === u.id && (!q.boTheId || a.boTheId === q.boTheId)).map((a) => Object.assign({ ngay: localDate(Date.parse(a.nopAt), tz) }, a)).filter((a) => a.ngay >= r.tu && a.ngay <= r.den);
      const l = db.learning[u.id] || { minutesPerDay: 10 };
      const theoNgay = r.list.map((d) => {
        const dr = rs.filter((x) => x.ngay === d);
        const da = as.filter((a) => a.ngay === d);
        const ms = dr.reduce((acc, x) => acc + x.thoiGianTraLoiMs, 0) + da.reduce((acc, a) => acc + a.thoiGianMs, 0);
        return { ngay: d, soLuotOn: dr.length, soCauLuyen: da.reduce((acc, a) => acc + a.tongSoCau, 0), soPhut: Math.round(ms / MIN) };
      });
      const tong = as.reduce((acc, a) => acc + a.tongSoCau, 0);
      const dung = as.reduce((acc, a) => acc + a.soCauDung, 0);
      return {
        muiGio: tz, tuNgay: r.tu, denNgay: r.den, boTheId: q.boTheId || null,
        soTuDaHoc: new Set(rs.map((x) => x.theId)).size, soLuotOn: rs.length,
        tyLeNho: rs.length ? Math.round(rs.filter((x) => x.danhGia !== "QUEN").length / rs.length * 100) : null,
        baiLuyen: { soBai: as.length, soCauDung: dung, tongSoCau: tong, tyLeDung: tong ? Math.round(dung / tong * 100) : null },
        tongPhut: theoNgay.reduce((acc, x) => acc + x.soPhut, 0), mucTieuPhutNgay: l.minutesPerDay,
        soNgayCoHoc: theoNgay.filter((x) => x.soLuotOn || x.soCauLuyen).length, soNgayDatMucTieu: theoNgay.filter((x) => x.soPhut >= l.minutesPerDay).length,
        chuoiNgay: streakOf(u.id, tz).chuoiNgay, theoNgay
      };
    }],
    ["GET", /^\/statistics\/skills$/, (m, b, q) => {
      const u = requireMe();
      if (q.boTheId) ownDeck(q.boTheId);
      return skillStats(u.id, q.boTheId || null);
    }],

    ["GET", /^\/admin\/users$/, (m, b, q) => {
      requireAdmin();
      let list = db.users.slice();
      if (q.q) { const k = strip(q.q); list = list.filter((x) => strip(x.email).includes(k) || strip(x.tenHienThi).includes(k)); }
      if (q.trangThai) list = list.filter((x) => x.trangThai === q.trangThai);
      if (q.vaiTro) list = list.filter((x) => x.vaiTro.includes(q.vaiTro));
      list.sort((a, c2) => c2.createdAt.localeCompare(a.createdAt));
      return page(list.map(adminUserView), Object.assign({ size: "10" }, q));
    }],
    ["PATCH", /^\/admin\/users\/(\w+)\/status$/, (m, b) => {
      const me2 = requireAdmin();
      const target = db.users.find((x) => x.id === m[1]);
      if (!target) notFound();
      const errors = [];
      if (!["HOAT_DONG", "BI_KHOA"].includes(b.trangThai)) errors.push(fe("trangThai", "Chọn khóa hoặc mở khóa"));
      const r = reason(b.lyDo);
      if (r.length < 10 || r.length > 500) errors.push(fe("lyDo", "Nhập lý do từ 10 đến 500 ký tự"));
      if (errors.length) bad(errors);
      if (target.id === me2.id) throw new ApiError(422, "BUSINESS_RULE", "Bạn không thể tự khóa tài khoản của mình.");
      if (target.trangThai === "DANG_XOA") throw new ApiError(422, "BUSINESS_RULE", "Tài khoản đang trong quá trình xóa, không đổi trạng thái được.");
      if (b.trangThai === "HOAT_DONG" && target.trangThai === "CHUA_XAC_THUC") throw new ApiError(422, "BUSINESS_RULE", "Tài khoản chưa xác thực email. Người dùng cần tự xác thực qua thư.");
      if (b.trangThai === "BI_KHOA" && target.vaiTro.includes("ADMIN") && activeAdmins().length <= 1 && target.trangThai === "HOAT_DONG") throw new ApiError(422, "BUSINESS_RULE", "Không thể khóa quản trị viên cuối cùng.");
      if (target.trangThai === b.trangThai) return Object.assign(adminUserView(target), { soPhienDaHuy: 0 });
      const before = target.trangThai;
      target.trangThai = b.trangThai;
      audit(me2, b.trangThai === "BI_KHOA" ? "KHOA_TAI_KHOAN" : "MO_KHOA_TAI_KHOAN", { loai: "NGUOI_DUNG", id: target.id, ten: target.tenHienThi }, r, { trangThai: before }, { trangThai: target.trangThai });
      return Object.assign(adminUserView(target), { soPhienDaHuy: b.trangThai === "BI_KHOA" && target.dangNhapCuoiAt ? 1 : 0 });
    }],
    ["PUT", /^\/admin\/users\/(\w+)\/roles$/, (m, b) => {
      const me2 = requireAdmin();
      const target = db.users.find((x) => x.id === m[1]);
      if (!target) notFound();
      const roles = Array.isArray(b.vaiTro) ? [...new Set(b.vaiTro)] : [];
      const errors = [];
      if (!roles.includes("USER") || roles.some((x) => !["USER", "ADMIN"].includes(x))) errors.push(fe("vaiTro", "Vai trò phải gồm Người học, có thể thêm Quản trị viên"));
      const r = reason(b.lyDo);
      if (r.length < 10 || r.length > 500) errors.push(fe("lyDo", "Nhập lý do từ 10 đến 500 ký tự"));
      if (errors.length) bad(errors);
      const had = target.vaiTro.includes("ADMIN");
      const will = roles.includes("ADMIN");
      if (had && !will && activeAdmins().filter((x) => x.id !== target.id).length === 0) throw new ApiError(422, "BUSINESS_RULE", "Không thể thu quyền của quản trị viên cuối cùng. Cấp quyền cho một người khác trước.");
      if (will && target.trangThai !== "HOAT_DONG") throw new ApiError(422, "BUSINESS_RULE", "Chỉ cấp quyền quản trị cho tài khoản đang hoạt động.");
      if (had === will) return adminUserView(target);
      const before = target.vaiTro.slice();
      target.vaiTro = will ? ["ADMIN", "USER"] : ["USER"];
      audit(me2, will ? "CAP_QUYEN_QUAN_TRI" : "THU_QUYEN_QUAN_TRI", { loai: "NGUOI_DUNG", id: target.id, ten: target.tenHienThi }, r, { vaiTro: before }, { vaiTro: target.vaiTro });
      return Object.assign(adminUserView(target), { banThanMatQuyen: target.id === me2.id && !will });
    }],

    ["GET", /^\/admin\/decks$/, (m, b, q) => {
      requireAdmin();
      let list = db.decks.filter((d) => d.kind === "MAU" && !d.deleted);
      if (q.q) { const k = strip(q.q); list = list.filter((d) => strip(d.name).includes(k)); }
      if (q.trangThai === "BAN_NHAP") list = list.filter((d) => d.visibility === "RIENG_TU" && d.trangThaiKiemDuyet !== "DA_AN");
      if (q.trangThai === "DA_XUAT_BAN") list = list.filter((d) => d.visibility === "CONG_KHAI" && d.trangThaiKiemDuyet !== "DA_AN");
      if (q.trangThai === "DA_AN") list = list.filter((d) => d.trangThaiKiemDuyet === "DA_AN");
      list.sort((a, c2) => c2.updatedAt.localeCompare(a.updatedAt));
      return page(list.map(adminDeckView), Object.assign({ size: "10" }, q));
    }],
    ["GET", /^\/admin\/decks\/(\w+)$/, (m) => {
      requireAdmin();
      return adminDeckView(sampleDeck(m[1]));
    }],
    ["POST", /^\/admin\/decks$/, (m, b) => {
      const me2 = requireAdmin();
      validateAdminDeck(b, false);
      const t = new Date().toISOString();
      const d = { id: nextId(), name: reason(b.ten), description: reason(b.moTa), goal: b.mucTieu, topicId: b.chuDeId, level: b.trinhDo, visibility: "RIENG_TU", kind: "MAU", ownerId: "0", ownerName: "Nhóm biên soạn VocabLearning", source: "Tự biên soạn", updatedAt: t, createdAt: t, version: 0, sourceDeckId: null, trangThaiKiemDuyet: "BINH_THUONG" };
      db.decks.push(d);
      audit(me2, "TAO_BO_MAU", { loai: "BO_THE", id: d.id, ten: d.name }, null, null, { ten: d.name, quyenTruyCap: "RIENG_TU" });
      return { status: 201, body: adminDeckView(d) };
    }],
    ["PATCH", /^\/admin\/decks\/(\w+)$/, (m, b) => {
      const me2 = requireAdmin();
      const d = sampleDeck(m[1]);
      if (b.version !== undefined && b.version !== d.version) throw new ApiError(409, "VERSION_CONFLICT", "Bộ mẫu vừa được sửa ở nơi khác. Tải lại để xem bản mới nhất.");
      validateAdminDeck(b, true);
      const before = adminDeckView(d);
      let action = "SUA_BO_MAU";
      let why = null;
      if (b.quyenTruyCap !== undefined) {
        if (!["CONG_KHAI", "RIENG_TU"].includes(b.quyenTruyCap)) bad([fe("quyenTruyCap", "Trạng thái xuất bản không hợp lệ")]);
        if (b.quyenTruyCap === "CONG_KHAI" && !db.cards.some((x) => x.deckId === d.id)) throw new ApiError(422, "BUSINESS_RULE", "Bộ chưa có thẻ nào. Thêm thẻ trước khi xuất bản.");
        if (b.quyenTruyCap !== d.visibility) action = b.quyenTruyCap === "CONG_KHAI" ? "XUAT_BAN_BO_MAU" : "CHUYEN_VE_NHAP";
        if (action === "CHUYEN_VE_NHAP") why = needReason(b.lyDo);
        d.visibility = b.quyenTruyCap;
      }
      if (b.trangThaiKiemDuyet !== undefined) {
        if (!["BINH_THUONG", "DA_AN"].includes(b.trangThaiKiemDuyet)) bad([fe("trangThaiKiemDuyet", "Trạng thái không hợp lệ")]);
        if (b.trangThaiKiemDuyet !== (d.trangThaiKiemDuyet || "BINH_THUONG")) { action = b.trangThaiKiemDuyet === "DA_AN" ? "AN_BO_MAU" : "HIEN_BO_MAU"; why = needReason(b.lyDo); }
        d.trangThaiKiemDuyet = b.trangThaiKiemDuyet;
      }
      if (b.ten !== undefined) d.name = reason(b.ten);
      if (b.moTa !== undefined) d.description = reason(b.moTa);
      if (b.mucTieu !== undefined) d.goal = b.mucTieu;
      if (b.chuDeId !== undefined) d.topicId = b.chuDeId;
      if (b.trinhDo !== undefined) d.level = b.trinhDo;
      d.version++;
      d.updatedAt = new Date().toISOString();
      const after = adminDeckView(d);
      const diff = (o) => { const out = {}; Object.keys(after).forEach((k) => { if (!["version", "updatedAt", "soThe", "soBanSao", "chuDeTen", "id"].includes(k) && before[k] !== after[k]) out[k] = o[k]; }); return out; };
      audit(me2, action, { loai: "BO_THE", id: d.id, ten: d.name }, why || reason(b.lyDo) || null, diff(before), diff(after));
      return after;
    }],
    ["DELETE", /^\/admin\/decks\/(\w+)$/, (m, b) => {
      const me2 = requireAdmin();
      const d = sampleDeck(m[1]);
      const why = needReason(b.lyDo);
      d.deleted = true;
      audit(me2, "XOA_BO_MAU", { loai: "BO_THE", id: d.id, ten: d.name }, why, { quyenTruyCap: d.visibility }, null);
      return { status: 204 };
    }],
    ["GET", /^\/admin\/cards$/, (m, b, q) => {
      requireAdmin();
      const d = sampleDeck(q.boTheId);
      return db.cards.filter((x) => x.deckId === d.id).map(theView);
    }],
    ["POST", /^\/admin\/cards$/, (m, b) => {
      const me2 = requireAdmin();
      const d = sampleDeck(b.boTheId);
      validateAdminCard(b, false);
      const x = { id: nextId(), deckId: d.id, word: reason(b.tu), pos: reason(b.tuLoai), ipa: reason(b.phienAm), meaningVi: reason(b.nghiaVi), exampleEn: reason(b.viDuEn), exampleVi: reason(b.dichVi), difficulty: 2, tagIds: [], imageUrl: null, audioUrl: null, version: 0, createdAt: new Date().toISOString() };
      db.cards.push(x);
      d.updatedAt = x.createdAt;
      audit(me2, "TAO_THE_MAU", { loai: "THE_TU_VUNG", id: x.id, ten: x.word + " (" + d.name + ")" }, null, null, { tu: x.word, nghiaVi: x.meaningVi });
      return { status: 201, body: theView(x) };
    }],
    ["PATCH", /^\/admin\/cards\/(\w+)$/, (m, b) => {
      const me2 = requireAdmin();
      const x = cardById(m[1]);
      if (!x) notFound();
      sampleDeck(x.deckId);
      if (b.version !== undefined && b.version !== x.version) throw new ApiError(409, "VERSION_CONFLICT", "Thẻ vừa được sửa ở nơi khác. Tải lại để xem bản mới nhất.");
      validateAdminCard(b, true);
      const before = theView(x);
      const map = { tu: "word", tuLoai: "pos", phienAm: "ipa", nghiaVi: "meaningVi", viDuEn: "exampleEn", dichVi: "exampleVi" };
      Object.keys(map).forEach((k) => { if (b[k] !== undefined) x[map[k]] = reason(b[k]); });
      x.version++;
      const after = theView(x);
      const tr = {};
      const sa = {};
      Object.keys(map).forEach((k) => { if (before[k] !== after[k]) { tr[k] = before[k]; sa[k] = after[k]; } });
      audit(me2, "SUA_THE_MAU", { loai: "THE_TU_VUNG", id: x.id, ten: x.word + " (" + deckName(x.deckId) + ")" }, null, tr, sa);
      return after;
    }],
    ["DELETE", /^\/admin\/cards\/(\w+)$/, (m) => {
      const me2 = requireAdmin();
      const x = cardById(m[1]);
      if (!x) notFound();
      const d = sampleDeck(x.deckId);
      if (d.visibility === "CONG_KHAI" && db.cards.filter((c2) => c2.deckId === d.id).length <= 1) throw new ApiError(422, "BUSINESS_RULE", "Bộ đang xuất bản cần ít nhất một thẻ. Chuyển bộ về bản nháp trước khi xóa thẻ cuối.");
      db.cards = db.cards.filter((c2) => c2.id !== x.id);
      audit(me2, "XOA_THE_MAU", { loai: "THE_TU_VUNG", id: x.id, ten: x.word + " (" + d.name + ")" }, null, { tu: x.word, nghiaVi: x.meaningVi }, null);
      return { status: 204 };
    }],
    ["GET", /^\/admin\/audit-logs$/, (m, b, q) => {
      const u = requireAdmin();
      const tz = tzOf(u);
      let list = db.audit.slice();
      if (q.hanhDong) list = list.filter((a) => a.hanhDong === q.hanhDong);
      if (q.loai) list = list.filter((a) => a.doiTuong && a.doiTuong.loai === q.loai);
      if (q.q) { const k = strip(q.q); list = list.filter((a) => strip(a.nguoiThucHien.tenHienThi).includes(k) || strip(a.doiTuong ? a.doiTuong.ten : "").includes(k) || strip(a.lyDo || "").includes(k)); }
      if (q.tuNgay) list = list.filter((a) => localDate(Date.parse(a.createdAt), tz) >= q.tuNgay);
      if (q.denNgay) list = list.filter((a) => localDate(Date.parse(a.createdAt), tz) <= q.denNgay);
      list.sort((a, c2) => c2.createdAt.localeCompare(a.createdAt));
      return page(list, Object.assign({ size: "10" }, q));
    }]
  ];

  function requireAdmin() { const u = requireMe(); if (!u.vaiTro.includes("ADMIN")) throw new ApiError(403, "FORBIDDEN", "Bạn không có quyền truy cập"); return u; }

  function handle(method, url, body, headers) {
    const [path, qs] = url.split("?");
    const q = Object.fromEntries(new URLSearchParams(qs || ""));
    if (flags.offline && !/^\/(public|auth)\//.test(path)) throw new ApiError(0, "NETWORK_ERROR", "Mất kết nối mạng. Kiểm tra kết nối rồi gửi lại.");
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

  function seedPractice() {
    if (db.practiceSeeded) return;
    const u = db.users.find((x) => x.id === "2");
    if (!u) return;
    const tz = "Asia/Ho_Chi_Minh";
    const sod = startOfLocalDay(now, tz);
    const at = (d, h) => sod - d * DAY + h * 3600000;
    const w = (word, deck) => db.cards.find((x) => x.deckId === (deck || "21") && x.word === word).id;
    const run = (spec) => {
      const s = createPractice(u, { loaiBai: spec.loaiBai, soCau: spec.soCau || 5, theIds: spec.theIds, boTheId: spec.boTheId || null, laLuyenLai: !!spec.laLuyenLai }, at(spec.d, spec.h));
      s.taoAt = iso(at(spec.d, spec.h) - spec.phut * MIN);
      const traLoi = s.cauHoi.map((q) => {
        const bad2 = spec.sai[q._snap ? q._snap.tu : ""];
        if (q.loaiCau === "GHEP_TU") return { cauHoiId: q.id, cap: q.dapAn.cap };
        if (q.phuongAn) {
          if (bad2 === undefined) return { cauHoiId: q.id, luaChonId: q.dapAn.luaChonId };
          const wrong = q._opts.find((o) => o.id !== q.dapAn.luaChonId && (!bad2 || o.noiDung === bad2));
          return { cauHoiId: q.id, luaChonId: bad2 === null ? null : (wrong ? wrong.id : null) };
        }
        return { cauHoiId: q.id, noiDung: bad2 === undefined ? q.dapAn.noiDung : bad2 };
      });
      return submitPractice(u, s, { submitKey: "seed-" + s.id, traLoi, thoiGianMs: spec.phut * MIN }, at(spec.d, spec.h));
    };
    run({ loaiBai: "CHON_NGHIA", theIds: [w("receipt"), w("postpone"), w("complimentary"), w("recipe"), w("uncharacteristically")], sai: { uncharacteristically: null }, d: 12, h: 20, phut: 3 });
    run({ loaiBai: "NHAP_TU_THEO_NGHIA", theIds: [w("receipt"), w("postpone"), w("recipe"), w("complementary"), w("complimentary")], sai: { receipt: "receit" }, d: 9, h: 21, phut: 4 });
    run({ loaiBai: "PHAN_BIET_CAP", soCau: 5, theIds: [w("complimentary"), w("complementary"), w("receipt"), w("recipe")], sai: { complimentary: "complementary", recipe: "receipt" }, d: 5, h: 19, phut: 3 });
    run({ loaiBai: "TONG_HOP", soCau: 5, boTheId: "22", theIds: ["How's it going?", "I'm running late", "get along with", "run out of", "appreciate"].map((x) => w(x, "22")), sai: { appreciate: "apreciate" }, d: 3, h: 20, phut: 4 });
    const last = run({ loaiBai: "NGHE_VIET", theIds: [w("receipt"), w("postpone"), w("uncharacteristically"), w("complimentary"), w("recipe")], sai: { receipt: "reciept", postpone: "post pone", uncharacteristically: "uncharacteristicly" }, d: 1, h: 21, phut: 4 });
    const again = createPractice(u, { loaiBai: "NGHE_VIET", soCau: 20, theIds: last.ketQua.filter((r) => !r.dung).map((r) => r.theId), laLuyenLai: true, nguon: "LUYEN_LAI" }, at(1, 21.5));
    submitPractice(u, again, { submitKey: "seed-" + again.id, thoiGianMs: 2 * MIN, traLoi: again.cauHoi.map((q) => ({ cauHoiId: q.id, noiDung: q._snap.tu === "uncharacteristically" ? "uncharacteristicaly" : q.dapAn.noiDung })) }, at(1, 21.5));
    db.practiceSeeded = true;
    save(db);
  }
  try { seedPractice(); } catch (e) { db.practiceSeeded = true; save(db); }

  function play(url, rate) {
    if (!("speechSynthesis" in window)) return false;
    let text = null;
    const m = /^demo-audio:\/\/(\w+)$/.exec(url || "");
    if (m) Object.values(db.practice).some((s) => s.cauHoi.some((q) => { if (q.id === m[1]) { text = q.dapAn.noiDung; return true; } return false; }));
    if (m && !text && cardById(m[1])) text = cardById(m[1]).word;
    if (!text) return false;
    speechSynthesis.cancel();
    const ut = new SpeechSynthesisUtterance(text);
    ut.lang = "en-US";
    ut.rate = rate || 0.9;
    speechSynthesis.speak(ut);
    return true;
  }

  window.VLDemo = {
    ApiError,
    DEMO_PASSWORD,
    handle,
    put,
    session,
    flags,
    play,
    localDate,
    reset() { localStorage.removeItem(KEY); session.clear(); db = load(); seedPractice(); },
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
