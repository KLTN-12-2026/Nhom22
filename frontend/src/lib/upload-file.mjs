export const FILE_TYPES = {
  ANH: { accept: 'image/jpeg,image/png,image/webp', max: 2097152, label: 'JPG, PNG hoặc WEBP, tối đa 2 MB' },
  AM_THANH: { accept: 'audio/mpeg,audio/wav,audio/wave,audio/x-wav,audio/vnd.wave,audio/flac,audio/x-flac', max: 5242880, label: 'MP3, WAV hoặc FLAC, tối đa 5 MB và 300 giây' },
};

export function validateFile(file, loai) {
  const rule = FILE_TYPES[loai];
  if (!rule || !file || !rule.accept.split(',').includes(file.type) || !file.size || file.size > rule.max) throw new Error(`Chọn tệp ${rule?.label || 'hợp lệ'}.`);
}

export async function uploadFile(file, loai, api, put = fetch) {
  validateFile(file, loai);
  const bytes = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const checksum = [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  const mimeType = file.type === 'audio/x-wav' ? 'audio/wav' : file.type === 'audio/x-flac' ? 'audio/flac' : file.type;
  const intent = await api('/api/v1/files/upload-requests', { method: 'POST', body: JSON.stringify({ loai, mimeType, kichThuoc: bytes.byteLength, checksum }) });
  let response;
  try { response = await put(intent.uploadUrl, { method: 'PUT', headers: { 'Content-Type': mimeType }, body: bytes, credentials: 'omit' }); }
  catch { throw new Error('Không kết nối được nơi lưu tệp. Kiểm tra kết nối rồi chọn lại tệp để thử lại.'); }
  if (!response.ok) throw new Error('Không tải được tệp. Chọn lại tệp để thử lại.');
  return api(`/api/v1/files/${intent.fileId}/complete`, { method: 'POST' });
}
