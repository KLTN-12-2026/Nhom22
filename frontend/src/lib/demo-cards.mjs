export const DEMO_CARDS = [
  { dir: 'Anh → Việt', prompt: 'receipt', sub: '/rɪˈsiːt/', pos: 'n.', en: true, options: ['lời mời', 'biên lai, giấy biên nhận', 'công thức nấu ăn', 'người nhận'], answer: 1, note: 'receipt là biên lai; recipe mới là công thức nấu ăn.' },
  { dir: 'Việt → Anh', prompt: 'hoãn lại', sub: 'động từ', en: false, options: ['postpone', 'prepare', 'propose', 'purchase'], answer: 0, note: 'The meeting has been postponed until Friday.' },
  { dir: 'Anh → Việt', prompt: 'complimentary', sub: '/ˌkɑːmplɪˈmentri/', pos: 'adj.', en: true, options: ['bổ sung cho nhau', 'miễn phí, tặng kèm', 'phức tạp', 'khen ngợi quá mức'], answer: 1, note: 'Dễ nhầm với complementary (bổ sung cho nhau).' },
  { dir: 'Anh → Việt', prompt: 'itinerary', sub: '/aɪˈtɪnəreri/', pos: 'n.', en: true, options: ['lịch trình chuyến đi', 'hóa đơn', 'người phiên dịch', 'thẻ lên máy bay'], answer: 0, note: 'Please send me the itinerary for the business trip.' },
  { dir: 'Việt → Anh', prompt: 'hạn chót', sub: 'danh từ', en: false, options: ['deadline', 'headline', 'guideline', 'timeline'], answer: 0, note: 'The deadline for the report is next Monday.' },
  { dir: 'Anh → Việt', prompt: 'reimburse', sub: '/ˌriːɪmˈbɜːrs/', pos: 'v.', en: true, options: ['tuyển dụng', 'hoàn trả tiền', 'gia hạn', 'thanh lý'], answer: 1, note: 'The company will reimburse your travel expenses.' },
  { dir: 'Việt → Anh', prompt: 'đồng nghiệp', sub: 'danh từ', en: false, options: ['colleague', 'college', 'collection', 'collector'], answer: 0, note: 'colleague khác college (trường cao đẳng).' },
  { dir: 'Anh → Việt', prompt: 'warranty', sub: '/ˈwɔːrənti/', pos: 'n.', en: true, options: ['kho hàng', 'giấy bảo hành', 'lời cảnh báo', 'hợp đồng thuê'], answer: 1, note: 'The laptop comes with a two-year warranty.' }
];

export const CARD_INTERVAL_MS = 10000;
