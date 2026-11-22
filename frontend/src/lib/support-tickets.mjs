import { foldText } from './search-text.mjs';

export const TICKET_CATEGORIES = { technical: 'Kỹ thuật', academic: 'Học vụ', payment: 'Thanh toán', other: 'Khác' };
export const TICKET_PRIORITIES = { low: 'Thấp', medium: 'Trung bình', high: 'Cao', critical: 'Nghiêm trọng' };
export const TICKET_STATUSES = { open: 'Đang mở', resolved: 'Đã giải quyết' };
export const TICKETS_PAGE_SIZE = 6;

// Frontend demo only. These records are never sent to a support service.
const fixtures = [
  ['Không nghe được âm thanh khi luyện phát âm', 'Mình đã bật âm lượng nhưng không nghe được âm thanh mẫu trong bài luyện phát âm trên Chrome.', 'technical', 'high', 'open'],
  ['Gói Pro chưa được kích hoạt sau thanh toán', 'Mình đã thanh toán thành công qua VNPay nhưng tài khoản vẫn chưa hiển thị gói Pro.', 'payment', 'critical', 'open'],
  ['Cần hướng dẫn điều chỉnh mục tiêu học tập', 'Mình muốn chuyển mục tiêu từ giao tiếp sang TOEIC. Nhờ đội ngũ hướng dẫn cách cập nhật.', 'academic', 'medium', 'open'],
  ['Không tải được ảnh minh họa cho bộ thẻ', 'Ảnh minh họa trong bộ thẻ TOEIC công sở không hiển thị khi mình mở trên điện thoại.', 'technical', 'medium', 'open'],
  ['Đề xuất thêm chủ đề từ vựng du lịch', 'Mình mong có thêm bộ từ vựng về đặt phòng khách sạn và hỏi đường để luyện giao tiếp.', 'other', 'low', 'resolved'],
  ['Cần kiểm tra lịch sử giao dịch tháng này', 'Mình muốn xem lại biên nhận và thời hạn của gói Premium vừa gia hạn.', 'payment', 'medium', 'resolved'],
  ['Tiến độ học chưa cập nhật trên thiết bị mới', 'Sau khi đăng nhập trên máy tính, số thẻ đã học khác với tiến độ trên điện thoại.', 'technical', 'high', 'open'],
  ['Thắc mắc về lịch ôn tập của bộ thẻ', 'Một số từ đã nhớ vẫn xuất hiện trong lịch ôn. Mình cần giải thích thêm cách tính lịch ôn.', 'academic', 'low', 'resolved'],
  ['Không thể nhập bộ thẻ từ tệp CSV', 'Mình chọn tệp CSV đúng định dạng nhưng màn hình không hiển thị phần xem trước.', 'technical', 'medium', 'resolved'],
  ['Nhờ hỗ trợ thay đổi thông tin cá nhân', 'Mình cần cập nhật tên hiển thị và múi giờ để nhận thông báo học đúng giờ.', 'other', 'low', 'resolved'],
  ['Thông báo nhắc học không xuất hiện', 'Mình đã bật nhắc học hằng ngày trong cài đặt nhưng chưa nhận được thông báo.', 'technical', 'medium', 'open'],
  ['Câu hỏi về nội dung bộ TOEIC nâng cao', 'Mình muốn biết trình độ phù hợp trước khi bắt đầu bộ từ vựng TOEIC nâng cao.', 'academic', 'medium', 'resolved'],
];

export function sampleTickets() {
  return fixtures.map(([title, description, category, priority, status], index) => ({
    id: `HT-${1042 - index}`, title, description, category, priority, status,
    createdAt: new Date(Date.UTC(2026, 10, 22 - index, 2, 30)).toISOString(),
  }));
}

const storageKey = userId => `vocab:support-tickets:v1:${userId}`;
const validTicket = ticket => ticket && /^HT-\d+$/.test(ticket.id)
  && typeof ticket.title === 'string' && typeof ticket.description === 'string'
  && Object.hasOwn(TICKET_CATEGORIES, ticket.category) && Object.hasOwn(TICKET_PRIORITIES, ticket.priority)
  && Object.hasOwn(TICKET_STATUSES, ticket.status) && Number.isFinite(Date.parse(ticket.createdAt));

export function readTickets(storage, userId) {
  try {
    const saved = JSON.parse(storage.getItem(storageKey(userId)));
    if (Array.isArray(saved) && saved.every(validTicket) && new Set(saved.map(t => t.id)).size === saved.length) return saved;
  } catch { /* Keep the demo usable when browser storage is unavailable. */ }
  return sampleTickets();
}

export function validateTicket(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Vui lòng nhập tiêu đề.';
  else if (values.title.length > 150) errors.title = 'Tiêu đề không được vượt quá 150 ký tự.';
  if (!values.description.trim()) errors.description = 'Vui lòng nhập mô tả.';
  return errors;
}

export function saveTicket(storage, userId, values) {
  if (userId == null || Object.keys(validateTicket(values)).length
    || !Object.hasOwn(TICKET_CATEGORIES, values.category) || !Object.hasOwn(TICKET_PRIORITIES, values.priority)) {
    throw new Error('Vui lòng kiểm tra lại thông tin phiếu hỗ trợ.');
  }
  const tickets = readTickets(storage, userId);
  const nextId = Math.max(1042, ...tickets.map(ticket => Number(ticket.id.slice(3)))) + 1;
  const ticket = {
    id: `HT-${nextId}`, title: values.title.trim(), description: values.description.trim(),
    category: values.category, priority: values.priority, status: 'open', createdAt: new Date().toISOString(),
  };
  const updated = [ticket, ...tickets];
  // Do not report success or change the list if storage rejects the write.
  storage.setItem(storageKey(userId), JSON.stringify(updated));
  return updated;
}

export function filterTickets(tickets, { search = '', category = '', priority = '', status = '' } = {}) {
  const query = foldText(search.trim());
  return tickets.filter(ticket => (!query || foldText(`${ticket.title} ${ticket.description}`).includes(query))
    && (!category || ticket.category === category) && (!priority || ticket.priority === priority)
    && (!status || ticket.status === status))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
