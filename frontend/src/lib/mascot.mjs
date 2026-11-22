export const MUC_EVENT = 'vocab:muc';
export const NAME_KEY = 'vocab:mascot:name';
export const DEFAULT_NAME = 'Mực';

function emit(detail) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(MUC_EVENT, { detail }));
}

export function mucSay(text, mood = 'wave', ttl = 5200) {
  emit({ type: 'say', text, mood, ttl });
}

export function mucCelebrate(text, ttl = 5200) {
  emit({ type: 'say', text, mood: 'success', ttl });
}

export function mucMood(mood) {
  emit({ type: 'mood', mood });
}

export function mucTip(text) {
  emit({ type: 'tip', text: text || null });
}

export function mucReview(correct) {
  emit({ type: 'review', correct: !!correct });
}

export function mucActivity(kind) {
  emit({ type: 'activity', kind });
}

export function readMucName() {
  try {
    const stored = localStorage.getItem(NAME_KEY);
    return stored?.trim() ? stored.trim().slice(0, 24) : DEFAULT_NAME;
  } catch {
    return DEFAULT_NAME;
  }
}

export function saveMucName(value) {
  const name = (value || '').trim().replace(/\s+/gu, ' ').slice(0, 24);
  localStorage.setItem(NAME_KEY, name || DEFAULT_NAME);
  emit({ type: 'name', name: name || DEFAULT_NAME });
  return name || DEFAULT_NAME;
}

export const SELECT_KEY = 'vocab:muc:select-lookup';
export const COLLAPSED_KEY = 'vocab:mascot:collapsed';

export function readMucSettings() {
  try {
    return { selectLookup: localStorage.getItem(SELECT_KEY) !== 'false', collapsed: localStorage.getItem(COLLAPSED_KEY) === 'true' };
  } catch {
    return { selectLookup: true, collapsed: false };
  }
}

export function saveMucSettings(patch) {
  if ('selectLookup' in patch) localStorage.setItem(SELECT_KEY, String(!!patch.selectLookup));
  if ('collapsed' in patch) localStorage.setItem(COLLAPSED_KEY, String(!!patch.collapsed));
  emit({ type: 'settings' });
}

export function todayLine(plan, name = DEFAULT_NAME) {
  if (!plan) return null;
  const due = (plan.soQuaHan || 0) + (plan.soDenHan || 0);
  const streak = plan.chuoiNgay || 0;
  if (plan.phienDangDo?.soChuaTraLoi > 0) return `Bạn đang học dở “${plan.phienDangDo.boTheTen || 'một phiên'}”, còn ${plan.phienDangDo.soChuaTraLoi} thẻ. Học tiếp nhé!`;
  if (!plan.tongSoThe) return `Chưa có thẻ nào để học. Mở Thư viện chọn một bộ, ${name} học cùng bạn!`;
  if (streak >= 2 && !plan.homNayDaTinhChuoi) return `Chuỗi ${streak} ngày rồi, hôm nay chưa học đâu nhé!`;
  if (due > 0) return `Còn ${due} thẻ đến hạn, khoảng ${Math.max(1, plan.uocTinhPhut || 1)} phút là xong.`;
  if (plan.soMoiConLai > 0) return `Hôm nay còn ${plan.soMoiConLai} từ mới đang chờ bạn.`;
  return 'Hết thẻ hôm nay rồi, giỏi quá 🎉';
}

export function todoCount(plan) {
  if (!plan) return 0;
  const due = (plan.soQuaHan || 0) + (plan.soDenHan || 0);
  if (due > 0) return due;
  if (plan.phienDangDo?.soChuaTraLoi > 0) return plan.phienDangDo.soChuaTraLoi;
  if ((plan.chuoiNgay || 0) > 0 && !plan.homNayDaTinhChuoi) return 1;
  return 0;
}

export function hardWords(notebook, limit = 3) {
  return [...(notebook?.items || [])]
    .sort((a, b) => (b.soLanQuen || 0) - (a.soLanQuen || 0))
    .slice(0, limit);
}

const SELECTABLE = /^[A-Za-z][A-Za-z'’-]*(?: [A-Za-z][A-Za-z'’-]*){0,3}$/u;

export function lookupCandidate(text) {
  const value = (text || '').replace(/\s+/gu, ' ').trim().replace(/^[^A-Za-z]+|[^A-Za-z]+$/gu, '');
  if (value.length < 2 || value.length > 40) return null;
  return SELECTABLE.test(value) ? value : null;
}

export const NO_LOOKUP_ROUTES = ['/hoc-phien', '/luyen-tap-lam-bai', '/phat-am'];
export const HIDDEN_ROUTES = ['/quan-tri', '/dang-nhap', '/dang-ky', '/quen-mat-khau', '/dat-lai-mat-khau', '/xac-thuc-email', '/chon-khu-vuc', '/bat-dau'];

export const ROUTE_TIPS = [
  ['/tu-dien', 'Mẹo: bôi đen một từ tiếng Anh ở bất kỳ trang nào, {ten} sẽ tra nghĩa giúp bạn.'],
  ['/thu-vien', 'Gặp từ lạ? Bôi đen nó, {ten} tra ngay cho.'],
  ['/so-tay', 'Đây là những từ bạn hay sai. Bấm Luyện để ôn đúng chỗ yếu nhé.'],
  ['/thong-ke', 'Kỹ năng nào thấp nhất thì luyện dạng bài đó trước nhé.'],
  ['/bo-the', 'Bấm Thêm thẻ rồi gõ từ, tiếng Việt cũng được. {ten} điền sẵn nghĩa cho.']
];

export function routeTip(path) {
  return ROUTE_TIPS.find(([route]) => path === route)?.[1] || null;
}

export function routeIn(path, list) {
  return list.some(route => path === route || path.startsWith(`${route}/`) || path.startsWith(`${route}?`));
}
