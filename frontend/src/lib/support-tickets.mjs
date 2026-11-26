import { foldText } from './search-text.mjs';

export const TICKET_CATEGORIES = { technical: 'Kỹ thuật', academic: 'Học vụ', payment: 'Thanh toán', other: 'Khác' };
export const TICKET_PRIORITIES = { low: 'Thấp', medium: 'Trung bình', high: 'Cao', critical: 'Nghiêm trọng' };
export const TICKET_STATUSES = { open: 'Đang mở', resolved: 'Đã giải quyết' };
export const TICKETS_PAGE_SIZE = 6;
export const TICKET_DESCRIPTION_MAX_LENGTH = 5000;

const CATEGORY_FROM_API = { KY_THUAT: 'technical', HOC_VU: 'academic', THANH_TOAN: 'payment', KHAC: 'other' };
const PRIORITY_FROM_API = { THAP: 'low', TRUNG_BINH: 'medium', CAO: 'high', NGHIEM_TRONG: 'critical' };
const STATUS_FROM_API = { DANG_MO: 'open', DA_GIAI_QUYET: 'resolved' };
const invert = map => Object.fromEntries(Object.entries(map).map(([key, value]) => [value, key]));
export const CATEGORY_TO_API = invert(CATEGORY_FROM_API);
export const PRIORITY_TO_API = invert(PRIORITY_FROM_API);
export const STATUS_TO_API = invert(STATUS_FROM_API);

export function fromApiTicket(ticket) {
  return {
    id: `HT-${ticket.id}`, rawId: ticket.id, version: ticket.version,
    title: ticket.tieuDe, description: ticket.moTa,
    category: CATEGORY_FROM_API[ticket.loaiVanDe] || 'other',
    priority: PRIORITY_FROM_API[ticket.doUuTien] || 'medium',
    status: STATUS_FROM_API[ticket.trangThai] || 'open',
    createdAt: ticket.createdAt, updatedAt: ticket.updatedAt,
    history: (ticket.phanHoi || []).map(item => ({
      author: item.nguoiXuLy, message: item.noiDung, action: item.hanhDong, createdAt: item.createdAt,
    })),
  };
}

export function toApiCreate(values) {
  return {
    tieuDe: values.title.trim(), moTa: values.description.trim(),
    loaiVanDe: CATEGORY_TO_API[values.category], doUuTien: PRIORITY_TO_API[values.priority],
  };
}

export function validateTicket(values) {
  const errors = {};
  if (!values.title.trim()) errors.title = 'Vui lòng nhập tiêu đề.';
  else if (values.title.length > 150) errors.title = 'Tiêu đề không được vượt quá 150 ký tự.';
  if (!values.description.trim()) errors.description = 'Vui lòng nhập mô tả.';
  else if (values.description.length > TICKET_DESCRIPTION_MAX_LENGTH) errors.description = 'Mô tả tối đa 5000 ký tự.';
  if (values.category !== undefined && !Object.hasOwn(TICKET_CATEGORIES, values.category)) errors.category = 'Vui lòng chọn loại vấn đề hợp lệ.';
  if (values.priority !== undefined && !Object.hasOwn(TICKET_PRIORITIES, values.priority)) errors.priority = 'Vui lòng chọn độ ưu tiên hợp lệ.';
  return errors;
}

export function filterTickets(tickets, { search = '', category = '', priority = '', status = '' } = {}) {
  const query = foldText(search.trim());
  return tickets.filter(ticket => (!query || foldText(`${ticket.title} ${ticket.description}`).includes(query))
    && (!category || ticket.category === category) && (!priority || ticket.priority === priority)
    && (!status || ticket.status === status))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
