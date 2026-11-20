export const AI_STATUS = { CHO: 'Đang chờ', DANG_XU_LY: 'Đang xử lý', HOAN_TAT: 'Hoàn tất', LOI: 'Lỗi', KHONG_XAC_DINH: 'Chưa xác định' };
export const AI_TYPE = { TAO_THE: 'Tạo thẻ', NGU_CANH: 'Giải thích ngữ cảnh', SUA_CAU: 'Viết câu', ANH_THE: 'Tạo ảnh' };
export const aiPending = status => ['CHO', 'DANG_XU_LY'].includes(status);
export const localDate = (value = new Date(), zone = 'Asia/Ho_Chi_Minh') => new Intl.DateTimeFormat('sv-SE', { timeZone: zone }).format(new Date(value));
export const dateTime = value => value ? new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
export function draftCommit(cards, deck) {
  const chosen = cards.filter(c => c.selected);
  if (!deck || !chosen.length || chosen.some(c => !c.word.trim() || !c.meaning.trim())) throw new Error('Chọn bộ đích, ít nhất một thẻ và điền từ/nghĩa.');
  return { boTheId: deck, banNhapIds: chosen.map(c => c.id), sua: chosen.map(c => ({ banNhapId: c.id, tu: c.word.trim(), tuLoai: c.part || null, nghiaVi: c.meaning.trim(), viDuEn: c.sentence || null, dichVi: c.translation || null })) };
}
export function pcmWav(samples, rate) {
  if (!samples.length || !Number.isFinite(rate) || rate <= 0) throw new Error('Bản ghi rỗng.');
  const count = Math.round(samples.length * 16000 / rate);
  const bytes = new ArrayBuffer(44 + count * 2), view = new DataView(bytes);
  const tag = (at, text) => [...text].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  tag(0, 'RIFF'); view.setUint32(4, 36 + count * 2, true); tag(8, 'WAVE'); tag(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  tag(36, 'data'); view.setUint32(40, count * 2, true);
  for (let i = 0; i < count; i++) {
    const position = i * rate / 16000, left = Math.floor(position), ratio = position - left;
    const sample = Math.max(-1, Math.min(1, samples[Math.min(left, samples.length - 1)] * (1 - ratio) + samples[Math.min(left + 1, samples.length - 1)] * ratio));
    view.setInt16(44 + i * 2, Math.round(sample * (sample < 0 ? 32768 : 32767)), true);
  }
  return bytes;
}
