'use client';

import { useId, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { cancelSubscription, date } from '@/lib/billing-api';
import styles from './CancelSubscriptionButton.module.css';

export function CancelSubscriptionButton({ subscription }) {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [reloading, setReloading] = useState(false);
  const noticeId = useId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const cancel = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      setIsOpen(false);
      toast('Đã hủy gói. Dữ liệu học và lịch sử thanh toán của bạn được giữ nguyên.', { variant: 'success' });
      // Refetch current subscription: a retry may refer to an older, already cancelled registration.
      void queryClient.invalidateQueries({ queryKey: ['billing'] });
      void queryClient.invalidateQueries({ queryKey: ['service-quota'] });
      void queryClient.invalidateQueries({ queryKey: ['me-plan'] });
    },
  });
  const busy = cancel.isPending || reloading;
  const conflict = cancel.error?.status === 409;
  const shown = target || subscription;

  async function reloadSubscription() {
    setReloading(true);
    try {
      const updated = await queryClient.fetchQuery({ queryKey: ['billing', 'subscription'], queryFn: () => apiFetch('/api/v1/me/subscription'), staleTime: 0 });
      setTarget(updated);
      cancel.reset();
      if (updated.trangThai !== 'HIEU_LUC') setIsOpen(false);
    } catch (error) {
      toast(error.message, { variant: 'error' });
    } finally {
      setReloading(false);
    }
  }

  if (subscription?.trangThai !== 'HIEU_LUC') return null;

  return (
    <>
      <Button variant="danger" size="sm" aria-haspopup="dialog" aria-expanded={isOpen} onClick={() => { setTarget(subscription); cancel.reset(); setIsOpen(true); }}>
        Hủy gói
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Hủy gói dịch vụ"
        size="sm"
        loading={busy}
        footer={(
          <>
            <Button variant="secondary" disabled={busy} onClick={() => setIsOpen(false)}>Giữ gói hiện tại</Button>
            <Button variant="danger" loading={cancel.isPending} disabled={busy || conflict} aria-describedby={noticeId} onClick={() => { if (!busy) cancel.mutate(shown); }}>Xác nhận hủy gói</Button>
          </>
        )}
      >
        <p className={styles.description}>Bạn đang sử dụng gói <strong>{shown.tenGoi || shown.goiMa}</strong>.</p>
        <dl className={styles.details}>
          <div><dt>Ngày hết hạn</dt><dd>{date(shown.hetHanAt)}</dd></div>
          {shown.soNgayConLai != null && <div><dt>Thời gian còn lại</dt><dd>{shown.soNgayConLai} ngày</dd></div>}
          <div><dt>Tự động gia hạn</dt><dd>Không</dd></div>
        </dl>
        <p className={styles.description}>Gói sẽ tự hết hiệu lực khi đến hạn. Bạn không cần hủy để ngừng gia hạn.</p>
        <p id={noticeId} className={styles.notice} role="note">Hủy gói có hiệu lực ngay và không hoàn tiền cho thời gian còn lại. Bạn sẽ cần mua gói mới để tiếp tục dùng các tính năng yêu cầu gói. Dữ liệu học và lịch sử thanh toán vẫn được giữ nguyên.</p>
        {cancel.isError && <p className={styles.error} role="alert">{cancel.error.message}</p>}
        {conflict && <Button variant="secondary" loading={reloading} onClick={reloadSubscription}>Tải lại gói</Button>}
      </Modal>
    </>
  );
}
