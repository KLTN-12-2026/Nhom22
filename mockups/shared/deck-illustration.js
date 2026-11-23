(function () {
const normalize = value => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();

const TOPIC_CODES = [
  { pattern: /\b(y te|suc khoe|benh vien|bac si|health|medical|hospital)\b/, code: 'Y TẾ', tone: 3 },
  { pattern: /\b(khoa hoc|cong nghe|science|technology)\b/, code: 'KHOA HỌC', tone: 4 },
  { pattern: /\b(toeic)\b/, code: 'TOEIC', tone: 1 },
  { pattern: /\b(cong viec|van phong|kinh doanh|tai chinh|office|business|finance)\b/, code: 'CÔNG VIỆC', tone: 1 },
  { pattern: /\b(doi song|hang ngay|daily|everyday)\b/, code: 'ĐỜI SỐNG', tone: 2 },
  { pattern: /\b(giao tiep|communication)\b/, code: 'GIAO TIẾP', tone: 2 },
  { pattern: /\b(am nhac|nghe thuat|music|art)\b/, code: 'NGHỆ THUẬT', tone: 5 },
  { pattern: /\b(du lich|san bay|travel|airport)\b/, code: 'DU LỊCH', tone: 5 },
];

const GOAL_CODES = { TOEIC: 'TOEIC', GIAO_TIEP: 'GIAO TIẾP', IELTS: 'IELTS' };
const TONES = 6;

function hash(value) {
  let h = 0;
  for (const ch of String(value || '')) h = (h * 31 + ch.codePointAt(0)) >>> 0;
  return h;
}

function firstLetter(word) {
  return [...word].find(ch => /\p{L}|\p{N}/u.test(ch)) || '';
}

function deckMonogram(title) {
  const text = String(title || '').trim();
  const focus = text.includes('—') ? text.split('—').pop() : text;
  const words = focus.split(/[\s,.;:()/-]+/).filter(Boolean);
  const letters = words.map(firstLetter).filter(Boolean);
  const mono = (letters[0] || '') + (letters[1] || '');
  return mono ? mono.toLocaleUpperCase('vi') : '·';
}

function deckCover(deck = {}, topicName = deck.tenChuDe) {
  let match = null;
  for (const text of [deck.ten, topicName]) {
    const normalized = normalize(text);
    match = TOPIC_CODES.find(topic => topic.pattern.test(normalized));
    if (match) break;
  }
  const code = match?.code || GOAL_CODES[deck.mucTieu] || (topicName ? String(topicName).split(/[&,]/)[0].trim().toLocaleUpperCase('vi').slice(0, 10) : 'BỘ THẺ');
  const tone = match?.tone || (hash(deck.chuDeId || topicName || deck.id || deck.ten) % TONES) + 1;
  const sample = String(deck.tuMau || '').trim();
  return { code, tone, word: sample || deckMonogram(deck.ten), sample: !!sample };
}

const escape = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
window.VLDeckCover = deckCover;
window.VLDeckThumbnail = function (deck) {
  const cover = deckCover({ ...deck, ten: deck.ten ?? deck.name }, deck.tenChuDe ?? deck.topicName);
  return '<span class="deck-thumbnail deck-cover" data-tone="' + cover.tone + '" aria-hidden="true"><span class="deck-cover-code">' + escape(cover.code) + '</span><span class="deck-cover-word">' + escape(cover.word) + '</span></span>';
};
})();
