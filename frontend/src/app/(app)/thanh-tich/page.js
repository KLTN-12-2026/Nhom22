'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { ErrorState, Icon, Pagination } from '@/components/ui';
import { BadgeArt } from '@/components/engagement/BadgeArt';
import styles from './page.module.css';

const SOURCE = { ON_THE: 'Lượt ôn thẻ', BAI_LUYEN: 'Bài luyện đã nộp' };
const CONDITION = {
  TONG_LUOT_ON: n => `${n} lượt ôn hợp lệ`,
  CHUOI_NGAY: n => `Chuỗi ${n} ngày học`,
  TONG_BAI_LUYEN: n => `${n} bài luyện đã nộp`,
  TONG_DIEM: n => `${n} điểm thưởng`
};

const fmtDay = day => {
  if (!day) return '';
  const [y, m, d] = String(day).slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};
const fmtDate = iso => (iso ? new Date(iso).toLocaleDateString('vi-VN') : '');

function Meter({ value, max, label }) {
  const v = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <div className="meter is-progress" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      <span style={{ '--v': v }}></span>
    </div>
  );
}

export default function AchievementsPage() {
  const [page, setPage] = useState(1);
  const rewards = useQuery({ queryKey: ['rewards', page], queryFn: () => apiFetch(`/api/v1/rewards/history?page=${page - 1}&size=10`) });
  const badges = useQuery({ queryKey: ['badges'], queryFn: () => apiFetch('/api/v1/badges') });
  const challenges = useQuery({ queryKey: ['challenges'], queryFn: () => apiFetch('/api/v1/challenges') });
  const today = useQuery({ queryKey: ['learning-today'], queryFn: () => apiFetch('/api/v1/learning/today'), retry: false });

  const all = badges.data || [];
  const earned = all.filter(b => b.daNhan);
  const latest = [...earned].sort((a, b) => new Date(b.nhanAt) - new Date(a.nhanAt))[0];
  const h = rewards.data;
  const c = challenges.data?.[0];
  const queries = [rewards, badges, challenges];
  const failed = queries.find(q => q.isError);
  const loading = queries.some(q => q.isPending);

  return (
    <div className="page">
      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.crumb} aria-label="Đường dẫn">
          <Link href="/hom-nay">Hôm nay</Link><span aria-hidden="true">/</span><span>Thành tích</span>
        </nav>
        <div className="form-head">
          <div className="form-code"><span>Học và mở rộng</span><span>Điểm · Huy hiệu · Thử thách</span></div>
          <h1 id="page-title">Thành tích của bạn</h1>
          <p>Điểm và điều kiện được máy chủ xác nhận từ việc học. Mỗi huy hiệu mở khóa một lần, không mất đi.</p>
        </div>

        {failed && <ErrorState title="Chưa tải được thành tích" description={failed.error.message} onRetry={() => queries.forEach(q => q.refetch())} />}
        {loading && !failed && (
          <div className="skeleton" role="status" aria-label="Đang tải thành tích">
            <div className="sk sk-row"></div><div className="sk sk-row"></div><div className="sk sk-row"></div>
          </div>
        )}

        {!loading && !failed && <>
          <div className={styles.hero}>
            <div className={styles.heroArt}>
              {latest ? <BadgeArt badge={latest} size={112} /> : <BadgeArt badge={all[0]} earned={false} size={112} />}
            </div>
            <div className={styles.heroBody}>
              <span className="caption">{latest ? `Huy hiệu mới nhất · ${fmtDate(latest.nhanAt)}` : 'Huy hiệu đầu tiên đang chờ bạn'}</span>
              <h2>{latest ? latest.ten : all[0]?.ten || 'Bắt đầu hành trình'}</h2>
              <p>{latest ? latest.moTa : all[0]?.moTa || 'Ôn thẻ hoặc làm bài luyện để nhận điểm và huy hiệu.'}</p>
              <div className={styles.collect}>
                <span><strong>{earned.length}</strong>/{all.length} huy hiệu</span>
                <Meter value={earned.length} max={all.length} label="Huy hiệu đã nhận" />
              </div>
            </div>
          </div>

          <dl className={`tally cols-2 ${styles.tally}`}>
            <div>
              <dt>Điểm thưởng<small>tích lũy từ lượt ôn và bài luyện</small></dt>
              <dd><span className="tally-n">{h?.tongDiem ?? 0}</span>điểm</dd>
            </div>
            <div className={styles.withMeter}>
              <dt>Điểm hôm nay<small>tối đa {h?.diemToiDaNgay ?? 0} điểm mỗi ngày</small></dt>
              <dd><span className="tally-n">{h?.diemHomNay ?? 0}</span>/{h?.diemToiDaNgay ?? 0}</dd>
              <Meter value={h?.diemHomNay || 0} max={h?.diemToiDaNgay || 0} label="Điểm hôm nay" />
            </div>
            <div>
              <dt>Chuỗi ngày hợp lệ<small>mỗi tuần được nghỉ 1 ngày không đứt chuỗi</small></dt>
              <dd><span className="tally-n">{today.data?.chuoiNgay ?? '—'}</span>ngày</dd>
            </div>
            <div className={styles.withMeter}>
              <dt>Thử thách tuần<small>{c ? c.ten : 'chưa có thử thách'}</small></dt>
              <dd><span className="tally-n">{c ? c.giaTri : '—'}</span>{c ? `/${c.mucTieu}` : ''}</dd>
              {c && <Meter value={c.giaTri} max={c.mucTieu} label={c.ten} />}
            </div>
          </dl>

          <section className={styles.section} aria-labelledby="badge-title">
            <div className={styles.secHead}>
              <h2 id="badge-title">Huy hiệu</h2>
              <span className="small muted">{earned.length} đã nhận · {all.length - earned.length} chưa mở khóa</span>
            </div>
            {all.length ? (
              <ul className={styles.badges} role="list">
                {all.map(b => (
                  <li key={b.id} className={b.daNhan ? styles.isEarned : styles.isLocked}>
                    <BadgeArt badge={b} earned={b.daNhan} size={76} />
                    <div className={styles.badgeBody}>
                      <h3>{b.ten}</h3>
                      <p>{b.moTa}</p>
                      <span className={styles.cond}><Icon name="target" />{(CONDITION[b.loaiDieuKien] || (n => `Ngưỡng ${n}`))(b.nguong)}</span>
                      {b.daNhan
                        ? <span className="stamp stamp-success"><Icon name="check" />Đã nhận · {fmtDate(b.nhanAt)}</span>
                        : <span className="stamp stamp-quiet">Chưa mở khóa</span>}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="notice">Chưa có huy hiệu nào đang hoạt động.</p>}
          </section>

          <section className={styles.section} aria-labelledby="challenge-title">
            <h2 id="challenge-title">Thử thách tuần</h2>
            {challenges.data?.length ? challenges.data.map(x => (
              <article key={x.id} className={`panel ${styles.challenge}`}>
                <div className={styles.challengeHead}>
                  <h3>{x.ten}</h3>
                  <span className={`stamp ${x.hoanThanhAt ? 'stamp-success' : 'stamp-quiet'}`}>{x.hoanThanhAt ? 'Đã hoàn thành' : 'Đang tham gia'}</span>
                </div>
                <p className={styles.challengeNum}><strong>{x.giaTri}</strong>/{x.mucTieu} lượt ôn hợp lệ · {fmtDay(x.tuanBatDau)} – {fmtDay(x.tuanKetThuc)}</p>
                <Meter value={x.giaTri} max={x.mucTieu} label={x.ten} />
                <p className="small muted">{x.moTa}. Điểm và điều kiện do máy chủ xác nhận.</p>
                {!x.hoanThanhAt && <Link className="btn btn-accent" href="/hoc">Bắt đầu học</Link>}
              </article>
            )) : <p className="notice">Tuần này chưa có thử thách.</p>}
          </section>

          <section className={styles.section} aria-labelledby="history-title">
            <h2 id="history-title">Lịch sử thưởng</h2>
            {h?.lichSu?.items?.length ? <>
              <div className="table-wrap">
                <table className="data-table">
                  <caption className="sr-only">{h.lichSu.totalElements} sự kiện thưởng, mới nhất trước</caption>
                  <thead><tr><th scope="col">Ngày</th><th scope="col">Nguồn hợp lệ</th><th scope="col" className={styles.num}>Điểm</th></tr></thead>
                  <tbody>
                    {h.lichSu.items.map(r => (
                      <tr key={r.id}>
                        <td>{fmtDay(r.ngayDiaPhuong)}</td>
                        <td>{SOURCE[r.loaiSuKien] || r.loaiSuKien}</td>
                        <td className={styles.num}>
                          <strong className={styles.plus}>+{r.soDiem}</strong>
                          {r.soDiem < r.diemGoc && <span className="small muted"> (đã chạm trần ngày)</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={h.lichSu.totalPages || 0} onPageChange={setPage} />
            </> : <p className="notice">Chưa có điểm thưởng. Hoàn thành lượt ôn hoặc nộp bài luyện để nhận điểm.</p>}
          </section>
        </>}
      </article>
    </div>
  );
}
