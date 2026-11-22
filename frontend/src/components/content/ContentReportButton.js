'use client';

import { useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { useMe } from '@/hooks/useMe';
import { useCooldown } from '@/hooks/useCooldown';
import { Modal, Select, Textarea, useToast } from '@/components/ui';
import styles from './ContentReportButton.module.css';

const REASONS = [
  { value: 'SAI_NOI_DUNG', label: 'Nghĩa hoặc giải thích sai' },
  { value: 'KHONG_PHU_HOP', label: 'Nội dung không phù hợp' },
  { value: 'KHAC', label: 'Lý do khác' },
];

export function ContentReportButton({ deck }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: me, isLoading, error: userError } = useMe();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0].value);
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const busy = useRef(false);
  const descriptionInput = useRef(null);
  const formId = useId();
  const report = useMutation({
    mutationFn: body => apiFetch('/api/v1/reports', { method: 'POST', body: JSON.stringify(body) }),
    retry: false,
    onSuccess: () => {
      setOpen(false);
      toast('Đã tiếp nhận báo cáo. Quản trị viên sẽ kiểm tra nội dung.', { variant: 'success' });
    },
  });
  const cooldown = useCooldown(report.error);
  const duplicate = report.error?.status === 409;
  const ownDeck = me && deck.chuSoHuuId && String(me.id) === String(deck.chuSoHuuId);
  const sessionExpired = report.error?.status === 401;

  const signIn = () => router.push(`/dang-nhap?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
  const startReport = () => {
    if (!me) { signIn(); return; }
    setFieldErrors({});
    setOpen(true);
  };
  const submit = async event => {
    event.preventDefault();
    if (busy.current || report.isPending || report.isSuccess || duplicate || cooldown || sessionExpired) return;
    const moTa = description.trim();
    if (moTa.length < 10 || moTa.length > 500) {
      setFieldErrors({ moTa: 'Mô tả từ 10 đến 500 ký tự, không tính khoảng trắng ở đầu và cuối.' });
      descriptionInput.current?.focus();
      return;
    }
    busy.current = true;
    setFieldErrors({});
    try {
      await report.mutateAsync({ loaiDoiTuong: 'BO_THE', doiTuongId: deck.id, lyDo: reason, moTa });
    } catch (error) {
      setFieldErrors(Object.fromEntries((error.fieldErrors || []).map(({ field, message }) => [field, message])));
    } finally { busy.current = false; }
  };

  return <>
    <button type="button" className="btn btn-secondary btn-lg" aria-haspopup="dialog" aria-expanded={open}
      disabled={isLoading || ownDeck || report.isSuccess || (!!userError && userError.status !== 401)}
      title={ownDeck ? 'Không thể báo cáo nội dung của chính bạn' : undefined} onClick={startReport}>
      {report.isSuccess ? 'Đã gửi báo cáo' : 'Báo cáo nội dung'}
    </button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Báo cáo nội dung" loading={report.isPending} className={styles.dialog} footer={<>
      <button type="button" className="btn btn-secondary" disabled={report.isPending} onClick={() => setOpen(false)}>{duplicate ? 'Đóng' : 'Hủy'}</button>
      {sessionExpired ? <button type="button" className="btn btn-primary" onClick={signIn}>Đăng nhập để gửi</button> : <button type="submit" form={formId} className="btn btn-primary" disabled={report.isPending || duplicate || cooldown > 0} aria-busy={report.isPending}>
        {report.isPending ? 'Đang gửi…' : cooldown > 0 ? `Thử lại sau ${cooldown}s` : 'Gửi báo cáo'}
      </button>}
    </>}>
      <form id={formId} className={styles.form} onSubmit={submit} noValidate>
        <p className={styles.target}><strong>Bộ thẻ:</strong> {deck.ten}</p>
        <fieldset disabled={report.isPending || duplicate || sessionExpired} className={styles.fields}>
          <Select label="Lý do" name="lyDo" required options={REASONS} value={reason} error={fieldErrors.lyDo} onChange={event => setReason(event.target.value)} />
          <Textarea ref={descriptionInput} label="Mô tả vấn đề" name="moTa" required minLength={10} maxLength={500} value={description} error={fieldErrors.moTa} onChange={event => { setDescription(event.target.value); setFieldErrors(current => ({ ...current, moTa: undefined })); }} />
        </fieldset>
        <p className="muted small">Mô tả từ 10 đến 500 ký tự. Không gửi thông tin cá nhân hoặc mật khẩu.</p>
        {report.error && <p className={`notice ${duplicate ? 'notice-warning' : 'notice-danger'}`} role="alert">{report.error.message}</p>}
      </form>
    </Modal>
  </>;
}
