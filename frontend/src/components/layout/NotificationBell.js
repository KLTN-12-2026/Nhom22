'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { EmptyState, ErrorState, Icon, Modal, Pagination } from '@/components/ui';
import styles from './NotificationBell.module.css';

const PAGE_SIZE = 20;

export function NotificationBell({ userId }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const queryKey = ['notifications', userId];

  const { data, isPending, isFetching, isPlaceholderData, error, refetch } = useQuery({
    queryKey: [...queryKey, page],
    queryFn: () => apiFetch(`/api/v1/notifications?page=${page}&size=${PAGE_SIZE}`),
    enabled: userId != null,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const openNotification = useMutation({
    mutationFn: notification => notification.daDocAt
      ? Promise.resolve(notification)
      : apiFetch(`/api/v1/notifications/${encodeURIComponent(notification.id)}`, {
        method: 'PATCH',
        body: JSON.stringify({ daDoc: true }),
      }),
    onSuccess: async notification => {
      await queryClient.invalidateQueries({ queryKey });
      // Only navigate to a local application path supplied by the API.
      const link = notification.lienKet;
      if (typeof link === 'string' && /^\/(?!\/)/.test(link) && !/[\\\u0000-\u0020]/.test(link)) {
        setIsOpen(false);
        router.push(link);
      }
    },
  });

  const unreadCount = data?.soChuaDoc ?? 0;
  const items = data?.thongBao?.items ?? [];
  const busy = openNotification.isPending;

  function openInbox() {
    setPage(0);
    openNotification.reset();
    setIsOpen(true);
    void queryClient.invalidateQueries({ queryKey });
  }

  return (
    <>
      <button
        type="button"
        className={`btn btn-quiet btn-icon ${styles.trigger}`}
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Thông báo"
        onClick={openInbox}
      >
        <Icon name="bell" />
        {unreadCount > 0 && <span className={styles.badge} aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Thông báo"
        className={styles.inbox}
        footer={<Link href="/ca-nhan/thong-bao" className="btn btn-secondary" onClick={() => setIsOpen(false)}><Icon name="settings" />Cài đặt nhắc học</Link>}
      >
        <div className={styles.toolbar}>
          <p role="status">{!data ? 'Thông báo mới nhất' : unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Bạn đã đọc tất cả thông báo'}</p>
          <button type="button" className="btn btn-quiet" onClick={() => refetch()} disabled={isFetching || busy}>Làm mới</button>
        </div>

        {openNotification.isError && <p className={styles.error} role="alert">Chưa thể mở thông báo. {openNotification.error.message} Bấm lại thông báo để thử lại.</p>}

        {isPending ? (
          <p className={styles.state} role="status">Đang tải thông báo…</p>
        ) : error && !data ? (
          <ErrorState title="Không tải được thông báo" description={error.message} onRetry={refetch} />
        ) : (
          <>
            {error && <p className={styles.error} role="alert">Chưa cập nhật được thông báo. Bấm “Làm mới” để thử lại.</p>}
            {items.length === 0 ? (
              <EmptyState icon={<Icon name="bell" size={32} />} title="Chưa có thông báo" description="Lời nhắc học và các thông báo mới sẽ xuất hiện tại đây. Bạn có thể bật nhắc học trong phần cài đặt." />
            ) : (
              <ul className={styles.list} aria-label="Danh sách thông báo" aria-busy={isFetching || busy}>
                {items.map(notification => {
                  const unread = !notification.daDocAt;
                  return (
                    <li key={notification.id}>
                      <button
                        type="button"
                        className={`${styles.item} ${unread ? styles.unread : ''}`}
                        disabled={busy || isPlaceholderData}
                        onClick={() => openNotification.mutate(notification)}
                      >
                        <span className={styles.itemHeading}>
                          <span className={styles.title}>{notification.tieuDe}</span>
                          {unread && <span className={styles.unreadLabel}>Chưa đọc</span>}
                        </span>
                        <span className={styles.content}>{notification.noiDung}</span>
                        <time className={styles.time} dateTime={notification.createdAt}>
                          {new Date(notification.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </time>
                        {busy && openNotification.variables?.id === notification.id && <span role="status">Đang mở…</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className={styles.pager} inert={isFetching || busy ? true : undefined}>
              <Pagination page={page + 1} totalPages={data?.thongBao?.totalPages ?? 0} onPageChange={next => setPage(next - 1)} />
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
