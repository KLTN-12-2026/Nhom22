'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { EmptyState, ErrorState, Icon, Modal, Pagination } from '@/components/ui';
import styles from './NotificationBell.module.css';

const PAGE_SIZE = 20;
const KIND = {
  NHAC_HOC: { icon: 'clock', tone: 'learn', label: 'Nhắc học' },
  GOI_SAP_HET_HAN: { icon: 'star', tone: 'plan', label: 'Gói dịch vụ' },
  GOI_DA_HET_HAN: { icon: 'alert', tone: 'warn', label: 'Gói dịch vụ' },
  YEU_CAU_CONG_KHAI: { icon: 'globe', tone: 'info', label: 'Công khai' },
  KET_QUA_CONG_KHAI: { icon: 'check', tone: 'ok', label: 'Công khai' },
  VINH_DANH_TUAN: { icon: 'shield', tone: 'plan', label: 'Vinh danh' },
};
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
function when(value) {
  const d = new Date(value);
  return sameDay(d, new Date())
    ? d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function NotificationBell({ userId }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const queryKey = ['notifications', userId];

  const { data, isPending, isFetching, isPlaceholderData, error, refetch } = useQuery({
    queryKey: [...queryKey, page],
    queryFn: () => apiFetch(`/api/v1/notifications?page=${page}&size=${PAGE_SIZE}`),
    enabled: userId != null,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    refetchInterval: 300_000,
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
  const allItems = data?.thongBao?.items ?? [];
  const items = onlyUnread ? allItems.filter(item => !item.daDocAt) : allItems;
  const today = new Date();
  const groups = [
    ['Hôm nay', items.filter(item => sameDay(new Date(item.createdAt), today))],
    ['Trước đó', items.filter(item => !sameDay(new Date(item.createdAt), today))],
  ].filter(([, list]) => list.length);
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
          <div className={styles.tabs} role="group" aria-label="Lọc thông báo">
            <button type="button" aria-pressed={!onlyUnread} onClick={() => setOnlyUnread(false)}>Tất cả</button>
            <button type="button" aria-pressed={onlyUnread} onClick={() => setOnlyUnread(true)}>Chưa đọc{unreadCount > 0 ? ` · ${unreadCount}` : ''}</button>
          </div>
          <p role="status" className={styles.summary}>{!data ? 'Thông báo mới nhất' : unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Đã đọc hết'}</p>
          <button type="button" className="btn btn-quiet btn-sm" onClick={() => refetch()} disabled={isFetching || busy}><Icon name="refresh" />Làm mới</button>
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
              onlyUnread && allItems.length
                ? <p className={styles.state} role="status">Không có thông báo chưa đọc ở trang này.</p>
                : <EmptyState icon={<Icon name="bell" size={32} />} title="Chưa có thông báo" description="Lời nhắc học và các thông báo mới sẽ xuất hiện tại đây. Bạn có thể bật nhắc học trong phần cài đặt." />
            ) : groups.map(([label, list]) => (
              <section key={label} className={styles.group} aria-label={label}>
                <h3 className={styles.groupTitle}>{label}</h3>
                <ol className={styles.list} aria-busy={isFetching || busy}>
                  {list.map(notification => {
                    const unread = !notification.daDocAt;
                    const kind = KIND[notification.loai] || { icon: 'bell', tone: 'info', label: 'Thông báo' };
                    const number = allItems.indexOf(notification) + 1 + page * PAGE_SIZE;
                    return (
                      <li key={notification.id}>
                        <button
                          type="button"
                          className={`${styles.item} ${unread ? styles.unread : ''}`}
                          disabled={busy || isPlaceholderData}
                          onClick={() => openNotification.mutate(notification)}
                          aria-label={`${unread ? 'Chưa đọc. ' : ''}${notification.tieuDe}`}
                        >
                          <span className={styles.num} aria-hidden="true">{String(number).padStart(2, '0')}</span>
                          <span className={styles.kind} data-tone={kind.tone} title={kind.label}><Icon name={kind.icon} /></span>
                          <span className={styles.body}>
                            <span className={styles.title}>{notification.tieuDe}</span>
                            <span className={styles.content}>{notification.noiDung}</span>
                            {busy && openNotification.variables?.id === notification.id && <span role="status" className={styles.content}>Đang mở…</span>}
                          </span>
                          <time className={styles.time} dateTime={notification.createdAt}>{when(notification.createdAt)}</time>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))}
            <div className={styles.pager} inert={isFetching || busy ? true : undefined}>
              <Pagination page={page + 1} totalPages={data?.thongBao?.totalPages ?? 0} onPageChange={next => setPage(next - 1)} />
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
