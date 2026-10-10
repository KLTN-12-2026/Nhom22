'use client';
import { useMutation } from '@tanstack/react-query';
import Image from 'next/image';
import { apiFetch } from '@/lib/api-client';
import { FILE_TYPES, uploadFile } from '@/lib/upload-file.mjs';

export function FileUpload({ label, loai, value, onChange, onBusy, disabled }) {
  const upload = useMutation({
    mutationFn: file => uploadFile(file, loai, apiFetch),
    onMutate: () => onBusy(true),
    onSuccess: file => onChange(file.id),
    onSettled: () => onBusy(false),
  });
  return <div className="field">
    <span className="field-label">{label}</span>
    <div className="content-file-box">
      <label className="btn btn-secondary content-file-picker" aria-disabled={disabled || upload.isPending}>
        {upload.isPending ? 'Đang tải tệp…' : value ? 'Thay tệp' : 'Chọn tệp'}
        <input type="file" aria-label={`Chọn ${label.toLowerCase()}`} accept={FILE_TYPES[loai].accept} disabled={disabled || upload.isPending} onChange={event => { const file = event.target.files[0]; if (file && !upload.isPending) upload.mutate(file); event.target.value = ''; }} />
      </label>
      <p className="field-hint">{FILE_TYPES[loai].label}.</p>
      {value && <div className="row"><span className="stamp stamp-success">Đã gắn tệp</span><button type="button" className="btn btn-quiet" disabled={disabled || upload.isPending} onClick={() => onChange('')}>Gỡ tệp</button></div>}
      {value === upload.data?.id && upload.data?.downloadUrl && (loai === 'ANH' ? <Image unoptimized src={upload.data.downloadUrl} alt="Ảnh đã tải lên" width={320} height={160} style={{ maxWidth: '100%', height: 'auto', maxHeight: 160, objectFit: 'contain' }} /> : <audio controls src={upload.data.downloadUrl} aria-label={label} style={{ maxWidth: '100%' }} />)}
      {upload.error && <p className="notice notice-error" role="alert">{upload.error.message}</p>}
    </div>
  </div>;
}
