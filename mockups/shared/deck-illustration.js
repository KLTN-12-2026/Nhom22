(function () {
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

const TOPICS = [
  { pattern: /\b(y te|suc khoe|benh vien|bac si|health|medical|medicine|hospital)\b/, file: 'health-cover.png' },
  { pattern: /\b(khoa hoc|cong nghe|thi nghiem|science|technology|laboratory)\b/, file: 'science-cover.png' },
  { pattern: /\b(toeic|cong viec|van phong|kinh doanh|tai chinh|office|business|finance|invoice)\b/, file: 'office-cover.png' },
  { pattern: /\b(giao tiep|doi song|hang ngay|ca phe|mua sam|communication|everyday|daily|coffee|shopping)\b/, file: 'everyday-cover.png' },
];

// The title wins over the broader topic. A goal alone is not a cover subject.
function deckIllustration(deck) {
  for (const text of [deck.ten ?? deck.name, deck.tenChuDe ?? deck.topicName]) {
    const normalized = normalize(text);
    const match = TOPICS.find(topic => topic.pattern.test(normalized));
    if (match) return match.file;
  }
  // Generic words like "vocabulary" do not override a specific named topic.
  return /\b(hoc|tu vung|learning|vocabulary)\b/.test(normalize(deck.ten ?? deck.name)) ? 'learning-desk.png' : null;
}

window.VLDeckIllustration = deckIllustration;
window.VLDeckThumbnail = function (deck) {
  const file = deckIllustration(deck);
  const contextCover = ['office-cover.png', 'everyday-cover.png'].includes(file);
  return file ? '<img class="deck-thumbnail' + (contextCover ? ' is-context-cover' : '') + '" src="../shared/assets/images/' + file + '" alt="" width="' + (contextCover ? 96 : 64) + '" height="' + (contextCover ? 72 : 48) + '" loading="lazy">' : '';
};
})();
