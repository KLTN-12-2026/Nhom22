export const SHARE_TARGETS = [
  { key: 'facebook', label: 'Facebook', hint: 'Đăng lên tường', mark: 'f', tone: '#1877f2', url: ({ url }) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
  { key: 'messenger', label: 'Messenger', hint: 'Gửi tin nhắn', mark: 'm', tone: '#0a7cff', mobile: true, url: ({ url }) => `fb-messenger://share/?link=${encodeURIComponent(url)}` },
  { key: 'telegram', label: 'Telegram', hint: 'Gửi tin nhắn', mark: 't', tone: '#1c8adb', url: ({ url, text }) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { key: 'whatsapp', label: 'WhatsApp', hint: 'Gửi tin nhắn', mark: 'w', tone: '#128c4a', url: ({ url, text }) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
  { key: 'x', label: 'X', hint: 'Đăng bài', mark: 'X', tone: '#14171a', url: ({ url, text }) => `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
  { key: 'linkedin', label: 'LinkedIn', hint: 'Đăng bài', mark: 'in', tone: '#0a66c2', url: ({ url }) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
  { key: 'email', label: 'Email', hint: 'Gửi thư', icon: 'mail', tone: '#5b6472', url: ({ url, text, title }) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n${url}`)}` },
];

export function deckShareUrl(origin, deckId) {
  return `${origin}/thu-vien/${encodeURIComponent(deckId)}`;
}

export function cardShareUrl(origin, deckId, cardId) {
  return `${deckShareUrl(origin, deckId)}?the=${encodeURIComponent(cardId)}`;
}

export function deckShareText(deck) {
  return `Học bộ thẻ “${deck.ten}” (${deck.soThe ?? 0} thẻ) trên VocabLearning`;
}

export function cardShareText(card) {
  return `${card.tu}${card.phienAm ? ` ${card.phienAm}` : ''}: ${card.nghiaVi}. Học từ này trên VocabLearning`;
}

export function deckShare(origin, deckId, deck) {
  return {
    title: 'Chia sẻ bộ thẻ',
    kicker: `Bộ thẻ · ${deck.soThe ?? 0} thẻ`,
    heading: deck.ten,
    detail: deck.moTa || '',
    text: deckShareText(deck),
    url: deckShareUrl(origin, deckId),
  };
}

export function cardShare(origin, deckId, card) {
  return {
    title: 'Chia sẻ thẻ',
    kicker: ['Thẻ từ vựng', card.tuLoai].filter(Boolean).join(' · '),
    heading: card.tu,
    sub: card.phienAm || '',
    detail: card.nghiaVi || '',
    text: cardShareText(card),
    url: cardShareUrl(origin, deckId, card.id),
  };
}

export const REPORT_REASONS = [
  { value: 'SAI_NOI_DUNG', title: 'Sai nghĩa hoặc thông tin', desc: 'Nghĩa, ví dụ hoặc từ loại không đúng.' },
  { value: 'SAI_CHINH_TA', title: 'Sai chính tả, phiên âm', desc: 'Viết sai từ, phiên âm hoặc bản dịch.' },
  { value: 'KHONG_PHU_HOP', title: 'Nội dung không phù hợp', desc: 'Phản cảm, thô tục hoặc xúc phạm.' },
  { value: 'SPAM', title: 'Spam hoặc quảng cáo', desc: 'Lặp vô nghĩa, chèn liên kết, quảng cáo.' },
  { value: 'BAN_QUYEN', title: 'Vi phạm bản quyền', desc: 'Chép tài liệu có bản quyền khi chưa được phép.' },
  { value: 'KHAC', title: 'Lý do khác', desc: 'Tự mô tả vấn đề bạn gặp.' },
];

export const USER_REPORT_REASONS = [
  { value: 'ANH_DAI_DIEN_NHAY_CAM', title: 'Ảnh đại diện nhạy cảm', desc: 'Ảnh khỏa thân, bạo lực hoặc phản cảm.' },
  { value: 'TEN_KHONG_PHU_HOP', title: 'Tên hiển thị không phù hợp', desc: 'Tên thô tục, xúc phạm hoặc kích động.' },
  { value: 'SPAM', title: 'Spam hoặc quảng cáo', desc: 'Liên tục đăng nội dung rác, chèn quảng cáo.' },
  { value: 'MAO_DANH', title: 'Mạo danh', desc: 'Giả làm người khác hoặc một tổ chức.' },
  { value: 'QUAY_ROI', title: 'Quấy rối', desc: 'Nhắm vào, đe dọa hoặc bắt nạt người khác.' },
  { value: 'KHAC', title: 'Lý do khác', desc: 'Tự mô tả vấn đề bạn gặp.' },
];

export function reportReasons(loaiDoiTuong) {
  return loaiDoiTuong === 'NGUOI_DUNG' ? USER_REPORT_REASONS : REPORT_REASONS;
}

export const UNAVAILABLE_USER = 'NGUOI_DUNG_KHONG_KHA_DUNG';

export function isUnavailableUser(error) {
  return error?.status === 404 && error?.data?.details?.lyDo === UNAVAILABLE_USER;
}

export const REPORT_NOTE_MIN = 10;
export const REPORT_NOTE_MAX = 500;

export function reportNoteError(lyDo, moTa) {
  const length = (moTa || '').trim().length;
  if (length > REPORT_NOTE_MAX) return `Mô tả tối đa ${REPORT_NOTE_MAX} ký tự.`;
  if (lyDo === 'KHAC' && length < REPORT_NOTE_MIN) return `Mô tả ít nhất ${REPORT_NOTE_MIN} ký tự (còn thiếu ${REPORT_NOTE_MIN - length}).`;
  return '';
}

export function sendReport(apiFetch, { loaiDoiTuong, doiTuongId, lyDo, moTa }) {
  const note = (moTa || '').trim();
  return apiFetch('/api/v1/reports', {
    method: 'POST',
    body: JSON.stringify({ loaiDoiTuong, doiTuongId, lyDo, ...(note ? { moTa: note } : {}) }),
  });
}
