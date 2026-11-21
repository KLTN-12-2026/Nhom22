export const MILESTONES = [5, 10, 20, 50, 100, 200, 500, 1000];

export const MILESTONE_LINES = {
  5: 'Năm ngày liền! Thói quen đang thành hình.',
  10: 'Mười ngày không nghỉ. Bạn bắt đầu nhớ từ lâu hơn rồi đó.',
  20: 'Hai mươi ngày! Học từ vựng đã thành nếp.',
  50: 'Năm mươi ngày bền bỉ. Thật đáng nể!',
  100: 'Một trăm ngày! Bạn thuộc nhóm người học kiên trì nhất.',
  200: 'Hai trăm ngày. Lửa này khó mà tắt được nữa.',
  500: 'Năm trăm ngày! Một hành trình huyền thoại.',
  1000: 'Một nghìn ngày. Không còn gì để nói ngoài: tuyệt vời!'
};

export function nextMilestone(streak) {
  return MILESTONES.find(value => value > streak) || null;
}

export function previousMilestone(streak) {
  return [...MILESTONES].reverse().find(value => value <= streak) || 0;
}

export function isMilestone(streak) {
  return MILESTONES.includes(streak);
}

export const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export function weekdayLabel(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  return DAY_LABELS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function shortDate(isoDate) {
  const [, m, d] = isoDate.split('-');
  return `${Number(d)}/${Number(m)}`;
}

export const DAY_STATE = {
  HOC: { label: 'Đã học', tone: 'fire' },
  NGHI: { label: 'Ngày nghỉ tự động', tone: 'rest' },
  KHOI_PHUC: { label: 'Đã khôi phục', tone: 'restore' },
  LO: { label: 'Lỡ mất', tone: 'miss' },
  CHUA_HOC: { label: 'Hôm nay, chưa đủ lượt', tone: 'today' }
};

export const streakKey = ['learning-streak'];
