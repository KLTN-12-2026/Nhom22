'use client';
import { useMemo, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Icon } from '@/components/ui';
import styles from './DashboardHighlights.module.css';

const DISMISS_KEY = 'vl-dismissed-announcements';

const DISMISS_EVENT = 'vl-announcements';

const subscribeDismissed = (listener) => {
  window.addEventListener(DISMISS_EVENT, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(DISMISS_EVENT, listener);
    window.removeEventListener('storage', listener);
  };
};
const dismissedSnapshot = () => { try { return window.localStorage.getItem(DISMISS_KEY) || '[]'; } catch { return '[]'; } };
const dismissedServerSnapshot = () => '[]';

const parseDismissed = (raw) => {
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const writeDismissed = (ids) => {
  try {
    window.localStorage.setItem(DISMISS_KEY, JSON.stringify(ids.slice(-50)));
  } catch {
  }
  window.dispatchEvent(new Event(DISMISS_EVENT));
};

const fmtTime = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const initial = (name) => (name || '?').trim().split(/\s+/).pop().charAt(0).toUpperCase();

function Heart({ n, label }) {
  return (
    <span className={styles.heart} aria-label={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.8 4.8a5.5 5.5 0 0 0-7.8 0L12 5.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z" /></svg>
      {n}
    </span>
  );
}

export function AnnouncementBanner() {
  const raw = useSyncExternalStore(subscribeDismissed, dismissedSnapshot, dismissedServerSnapshot);
  const dismissed = useMemo(() => parseDismissed(raw), [raw]);

  const { data } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => apiFetch('/api/v1/announcements'),
    staleTime: 5 * 60 * 1000,
    retry: false
  });

  const items = (data || []).filter((a) => !dismissed.includes(a.id));
  if (!items.length) return null;

  const dismiss = (id) => writeDismissed([...dismissed, id]);

  return (
    <section className={styles.bulletin} aria-label="Thông báo hệ thống">
      <div className={styles.bulletinHead}>Bảng tin · {items.length} thông báo</div>
      <ol role="list">
        {items.map((a) => {
          const important = a.mucDo === 'QUAN_TRONG';
          return (
            <li key={a.id} className={important ? styles.isImportant : undefined}>
              <span className={`stamp ${important ? 'stamp-warning' : 'stamp-quiet'}`}>{important ? 'Quan trọng' : 'Thông tin'}</span>
              <div className={styles.bulletinBody}>
                <strong>{a.tieuDe}</strong>
                <p>{a.noiDung}</p>
                {a.lienKet && <Link href={a.lienKet}>Xem chi tiết</Link>}
              </div>
              <button type="button" className={`btn btn-quiet btn-sm ${styles.dismiss}`} onClick={() => dismiss(a.id)} aria-label={`Ẩn thông báo ${a.tieuDe}`}>
                <Icon name="x" />
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function CommunitySection() {
  const [range, setRange] = useState('week');
  const { data, isError } = useQuery({
    queryKey: ['library-highlights'],
    queryFn: () => apiFetch('/api/v1/library/highlights'),
    staleTime: 5 * 60 * 1000,
    retry: false
  });

  if (isError || !data) return null;
  const decks = range === 'week' ? data.yeuThichTuan : data.yeuThichNhieuNhat;

  return (
    <section className={`sheet ${styles.community}`} aria-labelledby="community-title">
      <div className={styles.communityHead}>
        <h2 id="community-title">Cộng đồng tuần này</h2>
        <p>7 ngày qua, đến {fmtTime(data.denLuc)} hôm nay. Chỉ tính bộ công khai và lượt từ người khác.</p>
      </div>
      <div className={styles.communityGrid}>
        <div>
          <div className={styles.colHead}>
            <h3>Bộ được yêu thích</h3>
            <div className={styles.seg} role="group" aria-label="Khoảng thời gian">
              <button type="button" aria-pressed={range === 'week'} onClick={() => setRange('week')}>7 ngày qua</button>
              <button type="button" aria-pressed={range === 'all'} onClick={() => setRange('all')}>Mọi lúc</button>
            </div>
          </div>
          {decks.length ? (
            <ol className={`answer-list ${styles.rank}`} role="list">
              {decks.map((item, i) => (
                <li key={item.boThe.id} className="answer-row">
                  <span className="answer-no">{i + 1}</span>
                  <div className="answer-main">
                    <Link className="answer-title clamp-2" href={`/thu-vien/${item.boThe.id}`}>{item.boThe.ten}</Link>
                    <span className="answer-meta">
                      {item.boThe.tenChuDe && <span>{item.boThe.tenChuDe}</span>}
                      <span>{item.boThe.soThe} thẻ</span>
                      {item.boThe.tenTacGia && <span>{item.boThe.tenTacGia}</span>}
                    </span>
                  </div>
                  <div className="answer-side"><Heart n={item.soYeuThich} label={`${item.soYeuThich} lượt yêu thích`} /></div>
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.empty}>
              <p>{range === 'week' ? 'Tuần này chưa có bộ nào được yêu thích.' : 'Chưa có bộ công khai nào được yêu thích.'}</p>
            </div>
          )}
          <Link className={`btn btn-quiet ${styles.foot}`} href="/thu-vien">Mở thư viện</Link>
        </div>

        <div>
          <div className={styles.colHead}><h3>Người đóng góp nổi bật</h3></div>
          {data.dongGopTuan.length ? (
            <ol className={styles.people} role="list">
              {data.dongGopTuan.map((c, i) => (
                <li key={c.chuSoHuuId}>
                  <span className="answer-no">{i + 1}</span>
                  <span className={`avatar ${styles.avatar}`} aria-hidden="true">{initial(c.tenTacGia)}</span>
                  <span className={styles.who}>
                    <strong>{c.tenTacGia || 'Người học'}</strong>
                    <span>{c.soBoCongKhai} bộ công khai · {c.soSaoChep} lượt sao chép</span>
                  </span>
                  <Heart n={c.soYeuThich} label={`${c.soYeuThich} lượt yêu thích mới`} />
                </li>
              ))}
            </ol>
          ) : (
            <div className={styles.empty}>
              <p>Chưa có ai được yêu thích hay sao chép bộ trong 7 ngày qua.</p>
              <Link className="btn btn-secondary btn-sm" href="/bo-the">Chia sẻ bộ của bạn</Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
