import { foldText } from './search-text.mjs';
import { fromApiTicket, PRIORITY_TO_API, STATUS_TO_API, TICKET_PRIORITIES, TICKET_STATUSES } from './support-tickets.mjs';

export const SUPPORT_SORTS = { newest: 'Mới nhất trước', oldest: 'Cũ nhất trước', priority: 'Ưu tiên cao trước' };
const RANK = { critical: 0, high: 1, medium: 2, low: 3 };

export function toAdminEntry(apiTicket) {
  const ticket = fromApiTicket(apiTicket);
  const owner = {
    id: String(apiTicket.nguoiDung?.id ?? ''), tenHienThi: apiTicket.nguoiDung?.tenHienThi || '',
    email: apiTicket.nguoiDung?.email || '',
  };
  return { key: ticket.rawId, ownerId: owner.id, owner, ticket };
}

export function filterAdminTickets(entries, { search = '', category = '', priority = '', status = '', sort = 'newest' } = {}) {
  const query = foldText(search.trim());
  return entries.filter(({ ticket, owner }) => (!query || foldText(`${ticket.id} ${ticket.title} ${ticket.description} ${owner.tenHienThi} ${owner.email}`).includes(query))
    && (!category || ticket.category === category) && (!priority || ticket.priority === priority) && (!status || ticket.status === status))
    .sort((a, b) => (sort === 'priority' ? RANK[a.ticket.priority] - RANK[b.ticket.priority] : 0)
      || (sort === 'oldest' ? Date.parse(a.ticket.createdAt) - Date.parse(b.ticket.createdAt) : Date.parse(b.ticket.createdAt) - Date.parse(a.ticket.createdAt))
      || a.key.localeCompare(b.key));
}

export function validateSupportUpdate(ticket, { message = '', status, priority }) {
  if (!Object.hasOwn(TICKET_STATUSES, status) || !Object.hasOwn(TICKET_PRIORITIES, priority)) return 'Vui lòng chọn trạng thái và độ ưu tiên hợp lệ.';
  if (message.length > 2000) return 'Phản hồi tối đa 2000 ký tự.';
  if (!message.trim() && status === ticket.status && priority === ticket.priority) return 'Nhập phản hồi hoặc thay đổi trạng thái, độ ưu tiên trước khi lưu.';
  if (!message.trim() && status === 'resolved' && ticket.status !== 'resolved') return 'Nhập kết quả xử lý trước khi đánh dấu đã giải quyết.';
  return '';
}

export function toApiRespond(ticket, { message = '', status, priority }) {
  return {
    noiDung: message.trim(), trangThai: STATUS_TO_API[status], doUuTien: PRIORITY_TO_API[priority], version: ticket.version,
  };
}
