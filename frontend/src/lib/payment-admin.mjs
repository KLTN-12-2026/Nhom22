// Local fixtures matching mockups/dot3/quan-ly-thanh-toan.html; no billing API calls.
export const DEMO_CLOCK = '2026-11-12T10:00:00+07:00';
export const STORAGE_KEY = 'vocab:payment-admin:v1';
export const PAYMENT_STATUSES = {
  THANH_CONG: ['Thành công', 'success'],
  CHO_THANH_TOAN: ['Chờ thanh toán', 'pending'],
  THAT_BAI: ['Thất bại', 'failed'],
  HET_HAN: ['Hết hạn', 'expired'],
};
export const planName = code => code === 'PRO' ? 'Pro' : 'Premium';
export const money = value => new Intl.NumberFormat('vi-VN').format(value) + ' đ';
export const date = value => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
export const time = value => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
export const normalize = value => String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
export const isExpired = subscription => Date.parse(subscription.expiry) <= Date.parse(DEMO_CLOCK);
export const dayCount = subscription => Math.round((Date.parse(subscription.expiry.slice(0, 10)) - Date.parse(DEMO_CLOCK.slice(0, 10))) / 86400000);
export const isSoon = subscription => !isExpired(subscription) && dayCount(subscription) <= 7;
export const subscriptionStatus = subscription => isExpired(subscription) ? ['Đã hết hạn', 'expired'] : isSoon(subscription) ? [dayCount(subscription) === 0 ? 'Hết hạn hôm nay' : `Còn ${dayCount(subscription)} ngày`, 'pending'] : ['Còn hiệu lực', 'success'];

export const seedPlans = [
    { code: 'PRO', month: 299000, year: 2990000, cards: 5000, ai: 20, images: 10, speech: true, premium: false, active: true, version: 1 },
    { code: 'PREMIUM', month: 999000, year: 9990000, cards: null, ai: 100, images: 30, speech: true, premium: true, active: true, version: 1 }
  ];
  const users = [
    ['Nguyễn Hoài An', 'an@example.com'], ['Trần Minh Anh', 'minhanh@example.com'], ['Lê Quang Huy', 'quanghuy@example.com'],
    ['Phạm Thu Hà', 'thuha@example.com'], ['Võ Đức Minh', 'ducminh@example.com'], ['Đặng Ngọc Linh', 'ngoclinh@example.com'],
    ['Bùi Tuấn Khang', 'tuankhang@example.com'], ['Hoàng Mai Chi', 'maichi@example.com']
  ];
export const transactions = [
    [0, 'PRO', 'THANG', 'THANH_CONG', '12', '09:42'], [1, 'PREMIUM', 'NAM', 'THANH_CONG', '12', '09:30'],
    [2, 'PRO', 'THANG', 'CHO_THANH_TOAN', '12', '09:55'], [3, 'PREMIUM', 'THANG', 'THAT_BAI', '12', '08:32'],
    [4, 'PRO', 'NAM', 'THANH_CONG', '11', '16:05'], [5, 'PREMIUM', 'THANG', 'THANH_CONG', '11', '14:20'],
    [6, 'PRO', 'THANG', 'HET_HAN', '11', '10:15'], [7, 'PRO', 'THANG', 'THANH_CONG', '10', '17:48'],
    [0, 'PRO', 'THANG', 'THANH_CONG', '09', '09:10'], [3, 'PREMIUM', 'THANG', 'THANH_CONG', '08', '11:25'],
    [2, 'PRO', 'NAM', 'THAT_BAI', '07', '15:40'], [6, 'PRO', 'THANG', 'THANH_CONG', '06', '08:30']
  ].map(([user, plan, cycle, status, day, hour], i) => ({
    id: `DEMO-202611${day}-${String(128 - i).padStart(4, '0')}`, name: users[user][0], email: users[user][1], plan, cycle, status,
    amount: seedPlans.find((p) => p.code === plan)[cycle === 'NAM' ? 'year' : 'month'],
    created: `2026-11-${day}T${hour}:00+07:00`, gatewayId: status === 'THANH_CONG' ? String(14882900 + i) : null,
    response: status === 'THANH_CONG' ? '00' : status === 'THAT_BAI' ? '24' : null
  }));
export const seedSubscriptions = users.map(([name, email], i) => ({
    id: `SUB-${String(i + 1).padStart(4, '0')}`, name, email, plan: [1, 3, 5].includes(i) ? 'PREMIUM' : 'PRO',
    start: '2026-10-15T09:00:00+07:00', expiry: ['2026-12-12', '2027-11-12', '2026-11-15', '2026-11-18', '2026-11-10', '2026-12-11', '2026-11-12', '2026-11-20'][i] + 'T09:00:00+07:00'
  }));

export function createDemo() {
  return { plans: structuredClone(seedPlans), subscriptions: structuredClone(seedSubscriptions), reminders: [], expired: [], audit: [] };
}
export function filterPayments(filters) {
  const query = normalize(filters.query.trim());
  if (filters.from && filters.to && filters.from > filters.to) return [];
  return transactions.filter(t => (!query || normalize(`${t.id} ${t.name} ${t.email}`).includes(query)) &&
    (!filters.status || t.status === filters.status) && (!filters.plan || t.plan === filters.plan) &&
    (!filters.from || t.created.slice(0, 10) >= filters.from) && (!filters.to || t.created.slice(0, 10) <= filters.to));
}
export function checkExpiries(data, reason) {
  const next = structuredClone(data);
  let reminders = 0, expired = 0;
  next.subscriptions.forEach(s => {
    const expiredKey = `${s.id}:${s.expiry}`;
    const reminderKey = `${expiredKey}:2026-11-12`;
    if (isExpired(s) && !next.expired.includes(expiredKey)) { next.expired.push(expiredKey); expired++; }
    else if (isSoon(s) && !next.reminders.includes(reminderKey)) { next.reminders.push(reminderKey); reminders++; }
  });
  next.audit.push({ action: 'CHAY_KIEM_TRA_HET_HAN', target: 'ALL', reason, at: DEMO_CLOCK });
  return { data: next, reminders, expired };
}
export function paymentsCsv(items) {
  const rows = [['Mã đơn', 'Người dùng', 'Email', 'Gói', 'Chu kỳ', 'Số tiền (VND)', 'Trạng thái', 'Ngày tạo (giờ Việt Nam)'],
    ...items.map(t => [t.id, t.name, t.email, planName(t.plan), t.cycle === 'NAM' ? 'Năm' : 'Tháng', t.amount, PAYMENT_STATUSES[t.status][0], `${date(t.created)} ${time(t.created)}`])];
  const cell = value => '"' + String(value).replace(/^[\s]*[=+@-]/, "'$&").replace(/"/g, '""') + '"';
  return '\ufeff' + rows.map(row => row.map(cell).join(',')).join('\r\n');
}
export function receiptHtml(t) {
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  if (t.status !== 'THANH_CONG') return null;
  const details = [['Mã đơn', t.id], ['Người thanh toán', `${t.name} · ${t.email}`], ['Gói', `${planName(t.plan)} · ${t.cycle === 'NAM' ? '12 tháng' : '1 tháng'}`], ['Số tiền', money(t.amount)], ['Trạng thái', 'Thành công'], ['Ngày tạo', `${date(t.created)} ${time(t.created)} (giờ Việt Nam)`]];
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Biên nhận ${esc(t.id)}</title></head><body><h1>VocabLearning · Biên nhận mẫu</h1><p>Dữ liệu mô phỏng · VNPay Sandbox</p><dl>${details.map(([label, value]) => `<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('')}</dl><p>Biên nhận này dùng để xem thử giao diện.</p></body></html>`;
}
export function readDemo(storage) {
  try {
    const saved = JSON.parse(storage.getItem(STORAGE_KEY));
    // Invalid or older demo data must not prevent the page from opening.
    const seed = createDemo();
    const lists = ['plans', 'subscriptions', 'reminders', 'expired', 'audit'];
    if (!saved || !lists.every(key => Array.isArray(saved[key]))) return seed;
    const plansValid = saved.plans.length === seed.plans.length && seed.plans.every(p => saved.plans.filter(x => x?.code === p.code).length === 1) && saved.plans.every(p =>
      ['month', 'year', 'ai', 'images', 'version'].every(key => Number.isSafeInteger(p[key]) && p[key] >= (['month', 'year', 'version'].includes(key) ? 1 : 0)) &&
      (p.cards === null || (Number.isSafeInteger(p.cards) && p.cards > 0)) && ['active', 'speech', 'premium'].every(key => typeof p[key] === 'boolean'));
    const subsValid = saved.subscriptions.length === seed.subscriptions.length && seed.subscriptions.every(s => saved.subscriptions.filter(x => x?.id === s.id).length === 1) && saved.subscriptions.every(s =>
      ['name', 'email', 'start', 'expiry'].every(key => typeof s[key] === 'string') && ['PRO', 'PREMIUM'].includes(s.plan) && Number.isFinite(Date.parse(s.start)) && Number.isFinite(Date.parse(s.expiry)) && Date.parse(s.expiry) >= Date.parse(s.start));
    return plansValid && subsValid && [...saved.reminders, ...saved.expired].every(key => typeof key === 'string') ? saved : seed;
  } catch { return createDemo(); }
}
