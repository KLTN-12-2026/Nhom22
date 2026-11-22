'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { localDate } from '@/lib/remote-contract.mjs';
import { ErrorState, Icon } from '@/components/ui';
import { SKILL, SKILL_PRACTICE, label } from '@/lib/practice-labels.mjs';
import styles from './page.module.css';

const shift = (day, n) => {
  const [y, m, d] = day.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return date.toISOString().slice(0, 10);
};
const fmt = day => {
  if (!day) return '';
  const [y, m, d] = String(day).split('-');
  return `${d}/${m}/${y}`;
};
const pct = v => (v === null || v === undefined ? '—' : `${v}%`);

function Meter({ value, label: aria, tone }) {
  const v = Math.min(Math.max(Number(value) || 0, 0), 100);
  return <div className={tone === 'miss' ? `meter ${styles.miss}` : 'meter is-progress'} role="img" aria-label={aria}><span style={{ '--v': v / 100 }}></span></div>;
}

function Tally({ title, note, value, unit, meter }) {
  const hasMeter = meter !== undefined && meter !== null;
  return (
    <div className={hasMeter ? styles.withMeter : undefined}>
      <dt>{title}<small>{note}</small></dt>
      <dd><span className="tally-n">{value}</span>{unit}</dd>
      {hasMeter && <Meter value={meter} label={`${title} ${Math.round(meter)}%`} />}
    </div>
  );
}

export default function WeeklySummaryPage() {
  const [today] = useState(() => localDate());
  const [mode, setMode] = useState('this');
  const [picked, setPicked] = useState('');
  const day = mode === 'last' ? shift(today, -7) : mode === 'pick' ? picked : '';

  const query = useQuery({
    queryKey: ['weekly-summary', day],
    queryFn: () => apiFetch(`/api/v1/statistics/weekly-summary${day ? `?ngay=${day}` : ''}`)
  });
  const r = query.data;
  const empty = r && !r.soLuotOn && !r.soCauLuyen;
  const improved = r?.kyNang?.filter(k => k.tienBo) || [];
  const thin = r?.kyNang?.filter(k => !k.duDuLieu).map(k => label(SKILL, k.kyNang)) || [];

  return (
    <div className="page">
      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.crumb} aria-label="Đường dẫn">
          <Link href="/hom-nay">Hôm nay</Link><span aria-hidden="true">/</span><span>Tổng kết tuần</span>
        </nav>
        <div className="form-head">
          <div className="form-code">
            <span>Học và mở rộng</span>
            <span>{r ? `${fmt(r.tuNgay)} – ${fmt(r.denNgay)}` : 'Tuần học'}</span>
          </div>
          <h1 id="page-title">Tổng kết tuần</h1>
          <p>Nhìn lại một tuần, chọn việc vừa sức cho tuần sau.</p>
        </div>

        <form className={styles.filters} onSubmit={e => e.preventDefault()}>
          <fieldset className="fieldset">
            <legend>Tuần xem tổng kết</legend>
            <div className={`choice-grid cols-3 ${styles.choices}`}>
              {[['this', 'Tuần này'], ['last', 'Tuần trước'], ['pick', 'Chọn ngày']].map(([v, t]) => (
                <label key={v} className="choice choice-card">
                  <input type="radio" name="week" value={v} checked={mode === v} onChange={() => setMode(v)} />
                  <span className="bubble" aria-hidden="true"></span>
                  <span className="choice-body"><span className="choice-title">{t}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
          {mode === 'pick' && (
            <div className="field">
              <label className="field-label" htmlFor="week-day">Một ngày bất kỳ trong tuần</label>
              <input className="input" id="week-day" type="date" max={today} value={picked} onChange={e => setPicked(e.target.value)} />
            </div>
          )}
          {r && <p className={`small muted ${styles.zone}`}>{fmt(r.tuNgay)} → {fmt(r.denNgay)} · theo {r.muiGio}{r.tuanHienTai ? ' · tuần đang diễn ra' : ''}</p>}
        </form>

        {query.isError && <ErrorState title="Chưa tải được tổng kết tuần" description={query.error.message} onRetry={() => query.refetch()} />}
        {query.isPending && (
          <div className="skeleton" role="status" aria-label="Đang tải tổng kết tuần">
            <div className="sk sk-row"></div><div className="sk sk-row"></div><div className="sk sk-row"></div>
          </div>
        )}

        {empty && (
          <div className="empty">
            <div className="empty-sheet" aria-hidden="true">
              <span data-n="1"><i></i><i></i><i></i><i></i></span>
              <span data-n="2"><i></i><i></i><i></i><i></i></span>
            </div>
            <h2>{r.tomTat}</h2>
            <p>Ôn vài thẻ hoặc làm một bài luyện để có tổng kết tuần.</p>
            <Link className="btn btn-accent" href="/hom-nay">Học hôm nay</Link>
          </div>
        )}

        {r && !empty && <>
          <dl className={`tally cols-2 ${styles.tally}`}>
            <Tally title="Từ mới đã học" note={`${r.soTuDaHoc} từ có lượt ôn`} value={r.soTuMoi} unit="từ" />
            <Tally title="Lượt ôn hợp lệ" note={`tỷ lệ nhớ ${pct(r.tyLeNho)}`} value={r.soLuotOn} unit="lượt" meter={r.tyLeNho} />
            <Tally title="Ngày học hợp lệ" note={`${r.tongPhut} phút trong tuần`} value={r.soNgayCoHoc} unit="/7 ngày" meter={Math.round(r.soNgayCoHoc * 100 / 7)} />
            <Tally title="Câu luyện đã làm" note="bài luyện cố định, chấm tại máy chủ" value={r.soCauLuyen} unit="câu" />
          </dl>

          <section className={styles.section} aria-labelledby="sum-title">
            <h2 id="sum-title">Tóm tắt</h2>
            <p className={styles.lead}>{r.tomTat}</p>
            <p className="small muted">Câu tóm tắt dựng từ số liệu học, không dùng AI.</p>
          </section>

          <section className={styles.section} aria-labelledby="skill-title">
            <h2 id="skill-title">Kỹ năng trong tuần</h2>
            {r.kyNang.length ? (
              <div className="table-wrap">
                <table className="data-table">
                  <caption className="sr-only">Tỷ lệ đúng bài luyện so với tuần trước</caption>
                  <thead>
                    <tr>
                      <th scope="col">Kỹ năng</th>
                      <th scope="col">Tuần này</th>
                      <th scope="col" className={styles.num}>Tuần trước</th>
                      <th scope="col">Xu hướng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.kyNang.map(k => (
                      <tr key={k.kyNang}>
                        <th scope="row">{label(SKILL, k.kyNang)}</th>
                        <td className={styles.skillCell}>
                          {k.duDuLieu ? <>
                            <span className={styles.skillPct}>{pct(k.tyLeDung)}</span>
                            <span className="small muted"> · {k.soQuanSat} câu</span>
                            <Meter value={k.tyLeDung} label={`${label(SKILL, k.kyNang)} ${pct(k.tyLeDung)}`} />
                          </> : <>
                            <span className="stamp stamp-quiet">Chưa đủ dữ liệu</span>
                            <div className="small muted">{k.soQuanSat}/5 câu tối thiểu</div>
                          </>}
                        </td>
                        <td className={styles.num}>{k.soQuanSatTuanTruoc ? `${pct(k.tyLeDungTuanTruoc)} · ${k.soQuanSatTuanTruoc} câu` : '—'}</td>
                        <td>
                          {k.tienBo
                            ? <span className="stamp stamp-success"><Icon name="check" />Tiến bộ</span>
                            : <Link className="btn btn-quiet btn-sm" href={`/luyen-tap?loaiBai=${SKILL_PRACTICE[k.kyNang] || ''}`}>Luyện thêm</Link>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="notice">Tuần này chưa làm bài luyện nào.</p>}
            {improved.length === 0 && r.kyNang.length > 0 && <p className="small muted">Chưa có kỹ năng nào tiến bộ rõ so với tuần trước.</p>}
            {thin.length > 0 && <p className="small muted">Chưa đủ dữ liệu để so sánh (cần ít nhất 5 câu mỗi tuần): {thin.join(', ')}.</p>}
          </section>

          <div className={styles.columns}>
            <section className={styles.section} aria-labelledby="hard-title">
              <h2 id="hard-title">Ba từ cần chú ý</h2>
              {r.tuKho.length ? (
                <ol className={styles.words} role="list">
                  {r.tuKho.map((t, i) => (
                    <li key={t.theId}>
                      <span className="answer-no">{i + 1}</span>
                      <div className={styles.wordMain}>
                        <span className={`word ${styles.word}`} lang="en">{t.tu}</span>
                        <span className="small muted">{t.tenBo}</span>
                        <span className="small">Sai hoặc quên {t.soLanSai}/{t.soLuot} lượt trong tuần</span>
                        <Meter value={t.soLuot ? Math.round(t.soLanSai * 100 / t.soLuot) : 0} label={`Tỷ lệ sai ${t.soLanSai}/${t.soLuot}`} tone="miss" />
                      </div>
                      <Link className="btn btn-accent btn-sm" href={`/hoc?boTheId=${encodeURIComponent(t.boTheId)}`}>Ôn lại</Link>
                    </li>
                  ))}
                </ol>
              ) : <p className="notice">Tuần này chưa có từ nào bị quên hoặc làm sai.</p>}
            </section>

            <section className={styles.section} aria-labelledby="pass-title">
              <h2 id="pass-title">Từ đã vượt qua</h2>
              {r.tuDaVuotQua.length ? (
                <ul className={styles.passed} role="list">
                  {r.tuDaVuotQua.map((x, i) => (
                    <li key={i}><Icon name="check" /><span>{x.message}</span></li>
                  ))}
                </ul>
              ) : <p className="muted">Chưa có từ nào từng khó mà nay đúng liên tục.</p>}
            </section>
          </div>

          <section className={`panel ${styles.next}`} aria-labelledby="next-title">
            <h2 id="next-title" className="panel-title">Tuần sau, giữ mục tiêu vừa sức</h2>
            <p>{r.mucTieuTuanSau?.vanBan}</p>
            {r.mucTieuTuanSau && (
              <dl className="kv">
                <dt>Số ngày học</dt><dd>{r.mucTieuTuanSau.soNgayHoc} ngày</dd>
                <dt>Mỗi ngày</dt><dd>{r.mucTieuTuanSau.phutMoiNgay} phút</dd>
                {r.mucTieuTuanSau.theIds?.length > 0 && <><dt>Thẻ ưu tiên</dt><dd>{r.mucTieuTuanSau.theIds.length} thẻ</dd></>}
              </dl>
            )}
            <p className="small muted">Gợi ý theo số ngày bạn đã học tuần này; bạn quyết định có đổi kế hoạch hay không.</p>
            <div className={styles.actions}>
              <Link className="btn btn-primary" href="/hom-nay">Học hôm nay</Link>
              <Link className="btn btn-quiet" href="/ca-nhan/hoc-tap">Xem thiết lập học</Link>
            </div>
          </section>
        </>}
      </article>
    </div>
  );
}
