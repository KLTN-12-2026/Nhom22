'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ErrorState, Icon } from '@/components/ui';
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
  const diff = Math.max(0, Date.now() - d.getTime());
  if (diff < 60_000) return 'Vừa xong';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} phút`;
  if (sameDay(d, new Date())) return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const safeLink = link => typeof link === 'string' && /^\/(?!\/)/.test(link) && !/[\\\u0000- ]/.test(link);

export function NotificationBell({ userId }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const panelId = useId();
  const wrap = useRef(null);
  const trigger = useRef(null);
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
      if (safeLink(notification.lienKet)) {
        setIsOpen(false);
        router.push(notification.lienKet);
      }
    },
  });

  useEffect(() => {
    if (!isOpen) return undefined;
    const onPointer = event => { if (wrap.current && !wrap.current.contains(event.target)) setIsOpen(false); };
    const onKey = event => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [isOpen]);

  const unreadCount = data?.soChuaDoc ?? 0;
  const allItems = data?.thongBao?.items ?? [];
  const items = onlyUnread ? allItems.filter(item => !item.daDocAt) : allItems;
  const totalPages = data?.thongBao?.totalPages ?? 0;
  const today = new Date();
  const groups = [
    ['Hôm nay', items.filter(item => sameDay(new Date(item.createdAt), today))],
    ['Trước đó', items.filter(item => !sameDay(new Date(item.createdAt), today))],
  ].filter(([, list]) => list.length);
  const busy = openNotification.isPending;

  function toggle() {
    if (isOpen) { setIsOpen(false); return; }
    setPage(0);
    openNotification.reset();
    setIsOpen(true);
    void queryClient.invalidateQueries({ queryKey });
  }

  return (
    <span className={styles.wrap} ref={wrap}>
      <button
        ref={trigger}
        type="button"
        className={`btn btn-quiet btn-icon ${styles.trigger}`}
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={isOpen ? panelId : undefined}
        title="Thông báo"
        onClick={toggle}
      >
        <Icon name="bell" />
        {unreadCount > 0 && <span className={styles.badge} aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div id={panelId} className={styles.panel} role="dialog" aria-label="Thông báo">
          <header className={styles.head}>
            <div className={styles.headTitle}>
              <h2>Thông báo</h2>
              {unreadCount > 0 && <span className={styles.pill}>{unreadCount} mới</span>}
            </div>
            <button type="button" className={styles.iconBtn} onClick={() => refetch()} disabled={isFetching || busy} aria-label="Làm mới thông báo" title="Làm mới">
              <Icon name="refresh" />
            </button>
          </header>

          <div className={styles.tabs} role="group" aria-label="Lọc thông báo">
            <button type="button" aria-pressed={!onlyUnread} onClick={() => setOnlyUnread(false)}>Tất cả</button>
            <button type="button" aria-pressed={onlyUnread} onClick={() => setOnlyUnread(true)}>Chưa đọc{unreadCount > 0 && <span className={styles.tabCount}>{unreadCount}</span>}</button>
          </div>

          <div className={styles.scroll} aria-busy={isFetching || busy}>
            {openNotification.isError && <p className={styles.error} role="alert">Chưa mở được thông báo. {openNotification.error.message}</p>}
            {isPending ? (
              <div className={styles.skeleton} role="status" aria-label="Đang tải thông báo">
                {[0, 1, 2].map(i => <span key={i}><i /><b /></span>)}
              </div>
            ) : error && !data ? (
              <div className={styles.state}><ErrorState title="Không tải được thông báo" description={error.message} onRetry={refetch} /></div>
            ) : items.length === 0 ? (
              <div className={styles.empty}>
                <span className={styles.emptyIcon} aria-hidden="true"><Icon name="bell" /></span>
                <p className={styles.emptyTitle}>{onlyUnread && allItems.length ? 'Bạn đã đọc hết' : 'Chưa có thông báo'}</p>
                <p className={styles.emptyText}>{onlyUnread && allItems.length ? 'Không còn thông báo chưa đọc ở trang này.' : 'Lời nhắc học và kết quả duyệt sẽ hiện ở đây.'}</p>
              </div>
            ) : groups.map(([label, list]) => (
              <section key={label} className={styles.group} aria-label={label}>
                <h3 className={styles.groupTitle}>{label}</h3>
                <ul className={styles.list}>
                  {list.map(notification => {
                    const unread = !notification.daDocAt;
                    const kind = KIND[notification.loai] || { icon: 'bell', tone: 'info', label: 'Thông báo' };
                    const opening = busy && openNotification.variables?.id === notification.id;
                    return (
                      <li key={notification.id}>
                        <button
                          type="button"
                          className={`${styles.item}${unread ? ` ${styles.unread}` : ''}`}
                          disabled={busy || isPlaceholderData}
                          onClick={() => openNotification.mutate(notification)}
                          aria-label={`${unread ? 'Chưa đọc. ' : ''}${notification.tieuDe}`}
                        >
                          <span className={styles.kind} data-tone={kind.tone} aria-hidden="true"><Icon name={kind.icon} /></span>
                          <span className={styles.body}>
                            <span className={styles.title}>{notification.tieuDe}</span>
                            <span className={styles.content}>{notification.noiDung}</span>
                            <span className={styles.meta}>
                              <span>{kind.label}</span>
                              <time dateTime={notification.createdAt}>{opening ? 'Đang mở…' : when(notification.createdAt)}</time>
                            </span>
                          </span>
                          {unread && <span className={styles.dot} aria-hidden="true" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>

          <footer className={styles.foot}>
            <Link href="/ca-nhan/thong-bao" className={styles.footLink} onClick={() => setIsOpen(false)}><Icon name="settings" />Cài đặt nhắc học</Link>
            {totalPages > 1 && (
              <span className={styles.pager}>
                <button type="button" className={styles.iconBtn} onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0 || isFetching} aria-label="Trang trước"><Icon name="chevron-left" /></button>
                <span className={styles.pageNo}>{page + 1}/{totalPages}</span>
                <button type="button" className={styles.iconBtn} onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1 || isFetching} aria-label="Trang sau"><Icon name="chevron-right" /></button>
              </span>
            )}
          </footer>
        </div>
      )}
    </span>
  );
}
