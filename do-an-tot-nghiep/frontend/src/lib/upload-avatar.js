import { apiFetch } from './api-client';
import { uploadFile } from './upload-file.mjs';
export async function uploadAvatar(file) {
  const done = await uploadFile(file, 'ANH', apiFetch);
  return apiFetch('/api/v1/me/avatar', { method: 'PUT', body: JSON.stringify({ anhDaiDienId: done.id }) });
}
