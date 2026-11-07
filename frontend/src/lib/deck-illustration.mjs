const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

const TOPICS = [
  { pattern: /\b(y te|suc khoe|benh vien|bac si|health|medical|medicine|hospital)\b/, file: 'health-cover.png' },
  { pattern: /\b(khoa hoc|cong nghe|thi nghiem|science|technology|laboratory)\b/, file: 'science-cover.png' },
  { pattern: /\b(toeic|cong viec|van phong|kinh doanh|tai chinh|office|business|finance|invoice)\b/, file: 'office-cover.png' },
  { pattern: /\b(giao tiep|doi song|hang ngay|ca phe|mua sam|communication|everyday|daily|coffee|shopping)\b/, file: 'everyday-cover.png' },
];

export function deckIllustration(deck, topicName = deck.tenChuDe) {
  for (const text of [deck.ten, topicName]) {
    const normalized = normalize(text);
    const match = TOPICS.find(topic => topic.pattern.test(normalized));
    if (match) return match.file;
  }
  return /\b(hoc|tu vung|learning|vocabulary)\b/.test(normalize(deck.ten)) ? 'learning-desk.png' : null;
}
