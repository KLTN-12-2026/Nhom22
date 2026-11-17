import { apiFetch } from './api-client';
import { fetchAllPages } from './fetch-all-pages';

export const billingKeys = { all: ['billing'], admin: ['billing', 'admin'] };
export const money = value => new Intl.NumberFormat('vi-VN').format(value ?? 0) + ' đ';
export const date = value => value ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value)) : '—';
export const time = value => value ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value)) : '—';
export const statuses = { THANH_CONG: ['Thành công', 'success'], CHO_THANH_TOAN: ['Chờ thanh toán', 'pending'], THAT_BAI: ['Thất bại', 'failed'], HET_HAN: ['Hết hạn', 'expired'] };
export const normalize = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
export const mapPayment = t => ({ id: t.maDon, name: t.email || t.nguoiDungId || '—', email: t.email, plan: t.goiMa, planName: t.tenGoi, cycle: t.chuKy, amount: t.soTien, status: t.trangThai, created: t.taoAt, gatewayId: t.maGiaoDichCong, response: t.maPhanHoi, gateway: t.cong });
export const mapPlan = p => ({ code: p.ma, name: p.ten, month: p.giaThang, year: p.giaNam, cards: p.gioiHanThe, speech: p.phatAm, premium: p.boMauCaoCap, active: p.hoatDong, version: p.version });
export const isCancelled = s => s.status === 'DA_HUY';
export const isExpired = s => !isCancelled(s) && (s.status === 'HET_HAN' || Date.parse(s.expiry) <= Date.now());
export const isActiveSubscription = s => s.status === 'HIEU_LUC' && !isExpired(s);
export const isSoon = s => isActiveSubscription(s) && s.days != null && s.days <= 7;
export const subscriptionStatus = s => isCancelled(s) ? ['Đã hủy', 'failed'] : isExpired(s) ? ['Đã hết hạn', 'expired'] : isSoon(s) ? [`Còn ${s.days} ngày`, 'pending'] : ['Còn hiệu lực', 'success'];
export function cancelSubscription(subscription) {
  if (!subscription?.id || subscription.version == null) throw new Error('Thông tin gói chưa đầy đủ. Vui lòng tải lại trang.');
  return apiFetch('/api/v1/me/subscription/cancel', {
    method: 'POST',
    body: JSON.stringify({ id: subscription.id, version: subscription.version }),
  });
}
export async function loadAdminBilling() {
  const [payments, subscriptions, plans] = await Promise.all([
    fetchAllPages('/api/v1/admin/payments'), fetchAllPages('/api/v1/admin/subscriptions'), apiFetch('/api/v1/admin/plans'),
  ]);
  return { transactions: payments.map(mapPayment), plans: plans.map(mapPlan), subscriptions: subscriptions.map(s => ({ id: s.id, name: s.tenHienThi || s.email, email: s.email, plan: s.goiMa, start: s.batDauAt, expiry: s.hetHanAt, status: s.trangThai, days: s.soNgayConLai })) };
}
export function planPayload(p) {
  return { ten: p.name, giaThang: p.month, giaNam: p.year, gioiHanThe: p.cards, phatAm: p.speech, boMauCaoCap: p.premium, hoatDong: p.active, version: p.version };
}
export function paymentsCsv(items) {
  const rows = [['Mã đơn', 'Email', 'Gói', 'Chu kỳ', 'Số tiền (VND)', 'Trạng thái', 'Ngày tạo (giờ Việt Nam)'], ...items.map(t => [t.id, t.email || '', t.planName || t.plan, t.cycle, t.amount, statuses[t.status]?.[0] || t.status, `${date(t.created)} ${time(t.created)}`])];
  const cell = value => '"' + String(value).replace(/^\s*[=+@-]/, "'$&").replace(/"/g, '""') + '"';
  return '\ufeff' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
