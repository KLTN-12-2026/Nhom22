'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ErrorState, Icon } from '@/components/ui';
import { applySkin, useChooseTheme, useThemes } from '@/hooks/useThemes';
import { formatDay, groupThemes, skinSlug } from '@/lib/skins.mjs';
import { fx } from '@/lib/fx';
import styles from './page.module.css';

const PLAN_LABEL = { FREE: 'Free', PRO: 'Pro', PREMIUM: 'Premium' };

function festivalNote(theme) {
  const event = theme.leHoi;
  if (!event) return null;
  if (event.dangMo) return `Đang mở cho mọi người đến hết ${formatDay(event.denHet)}`;
  return `Mở cho mọi người ${formatDay(event.moTu)} – ${formatDay(event.denHet)}`;
}

export default function ThemesPage() {
  const { data, isLoading, error, refetch } = useThemes();
  const choose = useChooseTheme();
  const [trying, setTrying] = useState(null);
  const currentRef = useRef(null);
  useEffect(() => { currentRef.current = data?.giaoDienMa; }, [data?.giaoDienMa]);
  useEffect(() => () => { if (currentRef.current) applySkin(currentRef.current); }, []);

  if (isLoading) return <div className="skeleton"><div className="sk sk-title" /><div className="sk sk-row" /><div className="sk sk-row" /></div>;
  if (error) return <ErrorState description={error.message} onRetry={refetch} />;

  const groups = groupThemes(data.danhSach);
  const premium = data.goiMa === 'PREMIUM';

  const tryOn = theme => {
    setTrying(theme.ma);
    applySkin(theme.ma);
    fx.play('correct');
  };
  const stopTrying = () => { setTrying(null); applySkin(data.giaoDienMa); };
  const use = theme => { setTrying(null); choose.mutate(theme.ma, { onSuccess: () => fx.play('good') }); };

  return (
    <>
      <div className="form-head">
        <div className="form-code"><span>Tài khoản</span><span>Giao diện</span></div>
        <h1 id="page-title">Giao diện học</h1>
        <p>
          Gói hiện tại: <strong>{PLAN_LABEL[data.goiMa] || data.goiMa}</strong>.{' '}
          {premium ? 'Bạn dùng được tất cả giao diện, kể cả giao diện lễ hội bất cứ lúc nào.' : 'Giao diện lễ hội tự mở cho mọi người từ 10 ngày trước ngày lễ đến 3 ngày sau.'}
        </p>
      </div>

      {trying && (
        <div className={`notice ${styles.trying}`} role="status">
          <span>Đang xem thử. Trả lời đúng một thẻ hay hoàn thành bài để thấy hiệu ứng.</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={stopTrying}>Thôi xem thử</button>
        </div>
      )}
      {choose.error && <div data-form-error>{choose.error.message}</div>}

      {groups.map(group => (
        <section key={group.key} className={styles.group} aria-labelledby={`grp-${group.key}`}>
          <h2 id={`grp-${group.key}`} className={styles.groupTitle}>{group.label}</h2>
          <ul className={styles.grid} role="list">
            {group.items.map(theme => {
              const slug = skinSlug(theme.ma);
              const active = data.giaoDienMa === theme.ma;
              const note = festivalNote(theme);
              return (
                <li key={theme.ma} className={styles.card} data-active={active || undefined} data-locked={!theme.duocDung || undefined}>
                  <div className={styles.preview} data-preview={slug} aria-hidden="true">
                    <span className={styles.previewSheet}><i /><i /><i /></span>
                    <span className={styles.previewDot} />
                  </div>
                  <div className={styles.body}>
                    <div className={styles.titleRow}>
                      <h3>{theme.ten}</h3>
                      <span className={styles.tier} data-tier={theme.nhom === 'LE_HOI' ? 'LE_HOI' : theme.goiToiThieu}>{theme.nhom === 'LE_HOI' ? 'Lễ hội' : PLAN_LABEL[theme.goiToiThieu]}</span>
                    </div>
                    <p>{theme.moTa}</p>
                    <div className={styles.meta}>
                      {theme.coAmThanh && <span><Icon name="volume" /> Có âm thanh</span>}
                      {note && <span><Icon name="calendar" /> {note}</span>}
                    </div>
                    {!theme.duocDung && theme.lyDoKhoa && <p className={styles.lock}><Icon name="lock" /> {theme.lyDoKhoa}</p>}
                    <div className={styles.actions}>
                      {active ? (
                        <span className={styles.current}><Icon name="check" /> Đang dùng</span>
                      ) : theme.duocDung ? (
                        <button type="button" className="btn btn-primary btn-sm" disabled={choose.isPending} onClick={() => use(theme)}>Dùng giao diện này</button>
                      ) : (
                        <Link className="btn btn-accent btn-sm" href="/thanh-toan-goi">Nâng cấp</Link>
                      )}
                      {!active && trying !== theme.ma && <button type="button" className="btn btn-secondary btn-sm" onClick={() => tryOn(theme)}>Xem thử</button>}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
