import { foldText } from './search-text.mjs';
import { readTickets, TICKET_PRIORITIES, TICKET_STATUSES } from './support-tickets.mjs';

export const SUPPORT_STORAGE_PREFIX = 'vocab:support-tickets:v1:';
export const SUPPORT_UPDATE_EVENT = 'vocab:support-tickets-updated';
export const SUPPORT_SORTS = { newest: 'Mới nhất trước', oldest: 'Cũ nhất trước', priority: 'Ưu tiên cao trước' };
const SAMPLE_OWNER = { id: '2', tenHienThi: 'Nguyễn An', email: 'an@vocab.local' };
const RANK = { critical: 0, high: 1, medium: 2, low: 3 };

export function readAdminTickets(storage) {
  const owners = new Set([SAMPLE_OWNER.id]);
  try {
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index);
      if (key?.startsWith(SUPPORT_STORAGE_PREFIX) && key.length > SUPPORT_STORAGE_PREFIX.length) owners.add(key.slice(SUPPORT_STORAGE_PREFIX.length));
    }
  } catch { /* The sample remains readable when browser storage is unavailable. */ }
  return [...owners].flatMap(ownerId => {
    const tickets = readTickets(storage, ownerId);
    const requester = tickets.find(ticket => ticket.requester?.id === ownerId)?.requester;
    const owner = requester ? {
      id: ownerId,
      tenHienThi: typeof requester.tenHienThi === 'string' ? requester.tenHienThi : `Học viên #${ownerId}`,
      email: typeof requester.email === 'string' ? requester.email : '',
    } : ownerId === SAMPLE_OWNER.id ? SAMPLE_OWNER : { id: ownerId, tenHienThi: `Học viên #${ownerId}`, email: '' };
    return tickets.map(ticket => ({ key: `${ownerId}:${ticket.id}`, ownerId, owner, ticket }));
  });
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

export function saveSupportUpdate(storage, selected, values, actor) {
  if (!actor?.vaiTro?.includes('ADMIN')) throw new Error('Trang này dành cho quản trị viên.');
  const error = validateSupportUpdate(selected.ticket, values);
  if (error) throw new Error(error);
  const tickets = readTickets(storage, selected.ownerId);
  const index = tickets.findIndex(ticket => ticket.id === selected.ticket.id);
  if (index < 0 || JSON.stringify(tickets[index]) !== JSON.stringify(selected.ticket)) {
    const conflict = new Error('Phiếu đã thay đổi ở cửa sổ khác. Đóng chi tiết và mở lại để xem phiên bản mới.');
    conflict.code = 'SUPPORT_CONFLICT';
    throw conflict;
  }
  const actions = [];
  if (values.status !== selected.ticket.status) actions.push(`Trạng thái: ${TICKET_STATUSES[values.status]}`);
  if (values.priority !== selected.ticket.priority) actions.push(`Ưu tiên: ${TICKET_PRIORITIES[values.priority]}`);
  const createdAt = new Date().toISOString();
  tickets[index] = {
    ...tickets[index], status: values.status, priority: values.priority, updatedAt: createdAt,
    requester: selected.owner,
    history: [...(Array.isArray(tickets[index].history) ? tickets[index].history : []), {
      author: actor.tenHienThi || 'Quản trị viên', message: values.message.trim(),
      action: actions.join(' · ') || 'Đã phản hồi học viên', createdAt,
    }],
  };
  storage.setItem(SUPPORT_STORAGE_PREFIX + selected.ownerId, JSON.stringify(tickets));
  return { ownerId: selected.ownerId, tickets };
}
