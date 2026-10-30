export const DEFAULT_CARDS = [
  { id: 'd1', tu: 'invoice', tuLoai: 'n', phienAm: '/ˈɪn.vɔɪs/', nghiaVi: 'hóa đơn', viDuEn: 'Please check the invoice before making payment.', dichVi: 'Vui lòng kiểm tra hóa đơn trước khi thanh toán.' },
  { id: 'd2', tu: 'schedule', tuLoai: 'n', phienAm: '/ˈskedʒ.uːl/', nghiaVi: 'lịch trình', viDuEn: 'The meeting schedule has been updated.', dichVi: 'Lịch trình cuộc họp đã được cập nhật.' },
  { id: 'd3', tu: 'contract', tuLoai: 'n', phienAm: '/ˈkɑːn.trækt/', nghiaVi: 'hợp đồng', viDuEn: 'They signed a two-year contract yesterday.', dichVi: 'Họ đã ký hợp đồng hai năm vào hôm qua.' },
  { id: 'd4', tu: 'confirm', tuLoai: 'v', phienAm: '/kənˈfɝːm/', nghiaVi: 'xác nhận', viDuEn: 'Please confirm your attendance by Friday.', dichVi: 'Vui lòng xác nhận sự tham gia trước thứ Sáu.' },
  { id: 'd5', tu: 'negotiate', tuLoai: 'v', phienAm: '/nəˈɡoʊ.ʃi.eɪt/', nghiaVi: 'đàm phán, thương lượng', viDuEn: 'We need to negotiate a better price.', dichVi: 'Chúng ta cần đàm phán để có mức giá tốt hơn.' },
  { id: 'd6', tu: 'applicant', tuLoai: 'n', phienAm: '/ˈæp.lə.kənt/', nghiaVi: 'người nộp đơn, ứng viên', viDuEn: 'Each applicant must submit a resume.', dichVi: 'Mỗi ứng viên phải nộp một bản sơ yếu lý lịch.' },
  { id: 'd7', tu: 'budget', tuLoai: 'n', phienAm: '/ˈbʌdʒ.ɪt/', nghiaVi: 'ngân sách', viDuEn: 'The project exceeded its allocated budget.', dichVi: 'Dự án đã vượt quá ngân sách được phân bổ.' },
  { id: 'd8', tu: 'deadline', tuLoai: 'n', phienAm: '/ˈded.laɪn/', nghiaVi: 'hạn chót', viDuEn: 'The deadline for submission is 5 PM tomorrow.', dichVi: 'Hạn chót nộp bài là 5 giờ chiều ngày mai.' },
  { id: 'd9', tu: 'feedback', tuLoai: 'n', phienAm: '/ˈfiːd.bæk/', nghiaVi: 'phản hồi, ý kiến đóng góp', viDuEn: 'Customer feedback helps improve product quality.', dichVi: 'Phản hồi của khách hàng giúp cải thiện chất lượng sản phẩm.' },
  { id: 'd10', tu: 'promotion', tuLoai: 'n', phienAm: '/prəˈmoʊ.ʃən/', nghiaVi: 'thăng tiến, khuyến mãi', viDuEn: 'She earned a promotion after exceptional performance.', dichVi: 'Cô ấy được thăng chức sau thành tích xuất sắc.' }
];

export const NOTEBOOK_SEED = [
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

export const CONFUSING_PAIRS = [
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

export const SKILL_OF = { CHON_NGHIA: 'NHAN_NGHIA', CHON_TU: 'NHAN_NGHIA', GHEP_TU: 'NHAN_NGHIA', DIEN_CHO_TRONG: 'NGU_CANH', NHAP_TU_THEO_NGHIA: 'VIET', NGHE_VIET: 'NGHE', PHAN_BIET_CAP: 'CAP_NHAM' };

export const SKILLS = ['NHAN_NGHIA', 'VIET', 'NGHE', 'NGU_CANH', 'CAP_NHAM'];
