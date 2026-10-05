import { apiFetch } from './api-client';
export async function uploadAvatar(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 2097152) throw new Error('Chọn ảnh JPG, PNG hoặc WEBP tối đa 2 MB.');
  const bytes = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  const checksum = [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
  const intent = await apiFetch('/api/v1/files/upload-requests', { method: 'POST', body: JSON.stringify({ loai: 'ANH', mimeType: file.type, kichThuoc: file.size, checksum }) });
  const put = await fetch(intent.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: bytes, credentials: 'omit' });
  if (!put.ok) throw new Error('Không tải được ảnh. Vui lòng thử lại.');
  const done = await apiFetch(`/api/v1/files/${intent.fileId}/complete`, { method: 'POST' });
  return apiFetch('/api/v1/me/avatar', { method: 'PUT', body: JSON.stringify({ anhDaiDienId: done.id }) });
}
