'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import styles from './page.module.css';

const ERROR_GROUP = {
  NGHIA: 'Nghĩa',
  CHINH_TA: 'Chính tả',
  NGHE: 'Nghe',
  NGU_CANH: 'Ngữ cảnh',
  CAP_NHAM: 'Cặp dễ nhầm'
};

const PRACTICE_MAP = {
  NHAN_NGHIA: 'CHON_NGHIA',
  VIET: 'NHAP_TU_THEO_NGHIA',
  NGHE: 'NGHE_VIET',
  NGU_CANH: 'DIEN_CHO_TRONG',
  CAP_NHAM: 'PHAN_BIET_CAP'
};

function formatDay(dateStr, includeYear = false) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (includeYear) {
    return d.toLocaleDateString('vi-VN');
  } else {
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  }
}

function StatsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const today = new Date().toISOString().split('T')[0];
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const [rangeType, setRangeType] = useState('7');
  const [tuNgay, setTuNgay] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [denNgay, setDenNgay] = useState(today);
  const [deckId, setDeckId] = useState('');
  
  const [viewMode, setViewMode] = useState('chart'); // 'chart' or 'table'

  const { data: myDecks } = useQuery({
    queryKey: ['my-decks'],
    queryFn: () => apiFetch('/api/v1/decks?tab=mine').catch(() => ({ items: [] }))
  });

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview, isError: overviewError } = useQuery({
    queryKey: ['stats-overview', rangeType, tuNgay, denNgay, deckId],
    queryFn: () => {
      let qTu = tuNgay;
      let qDen = denNgay;
      if (rangeType === '7') {
        const d = new Date(); d.setDate(d.getDate() - 6);
        qTu = d.toISOString().split('T')[0];
        qDen = today;
      } else if (rangeType === '30') {
        const d = new Date(); d.setDate(d.getDate() - 29);
        qTu = d.toISOString().split('T')[0];
        qDen = today;
      }
      return apiFetch(`/api/v1/statistics/overview?tuNgay=${qTu}&denNgay=${qDen}${deckId ? `&boTheId=${deckId}` : ''}`);
    }
  });

  const { data: skills, isLoading: skillsLoading, isError: skillsError } = useQuery({
    queryKey: ['stats-skills', deckId],
    queryFn: () => apiFetch(`/api/v1/statistics/skills${deckId ? `?boTheId=${deckId}` : ''}`)
  });

  const handleApply = (e) => {
    e.preventDefault();
    if (rangeType === 'custom') {
      if (!tuNgay || !denNgay) return alert('Vui lòng chọn ngày bắt đầu và kết thúc');
      if (tuNgay > denNgay) return alert('Ngày bắt đầu phải trước ngày kết thúc');
      const diffDays = (new Date(denNgay) - new Date(tuNgay)) / 86400000;
      if (diffDays > 90) return alert('Chỉ được chọn khoảng tối đa 90 ngày');
    }
    refetchOverview();
  };

  const getLowestSkill = () => {
    if (!skills) return null;
    const known = skills.filter(s => s.duDuLieu).sort((a, b) => a.mucLamChu - b.mucLamChu);
    return known.length > 0 ? known[0] : null;
  };
  const lowestSkill = getLowestSkill();
  const thinSkills = skills ? skills.filter(s => !s.duDuLieu) : [];

  const renderChart = () => {
    if (!overview || !overview.theoNgay || overview.theoNgay.length === 0) return null;
    
    const maxVal = Math.max(overview.mucTieuPhutNgay || 1, ...overview.theoNgay.map(d => d.soPhut));
    const maxGrid = Math.ceil(maxVal * 1.2) || 1;
    const goalH = ((overview.mucTieuPhutNgay || 0) / maxGrid) * 100;

    return (
      <div id="chart-box">
        <div className={styles.chart}>
          <div className={styles.chartAxis} aria-hidden="true">
            <span>{maxGrid}</span>
            <span>{Math.round(maxGrid / 2)}</span>
            <span>0</span>
          </div>
          <div className={styles.chartPlot} role="img">
            {overview.theoNgay.map((d, i) => {
              const h = (d.soPhut / maxGrid);
              const isGoal = d.soPhut >= overview.mucTieuPhutNgay && d.soPhut > 0;
              return (
                <div key={i} className={styles.chartBar} data-goal={isGoal ? "" : undefined} title={`${formatDay(d.ngay, true)}: ${d.soPhut} phút`}>
                  <i style={{ '--v': h }}></i>
                </div>
              );
            })}
            <div className={styles.chartGoal} style={{ '--g': `${goalH}%` }}>
              <span>Mục tiêu {overview.mucTieuPhutNgay || 0}p</span>
            </div>
          </div>
          <div className={styles.chartX} aria-hidden="true">
            {overview.theoNgay.map((d, i) => {
              const totalDays = overview.theoNgay.length;
              let showLabel = false;
              if (totalDays <= 7) showLabel = true;
              else if (totalDays <= 31) showLabel = i === 0 || i === totalDays - 1 || i % 5 === 0;
              else showLabel = i === 0 || i === totalDays - 1 || i % 15 === 0;
              
              return (
                <span key={i}>{showLabel ? formatDay(d.ngay) : ''}</span>
              );
            })}
          </div>
        </div>
        <div className={styles.legend} aria-hidden="true">
          <span><i></i>Số phút học</span>
          <span><i className={styles.ok}></i>Đạt mục tiêu ngày</span>
          <span><i className={styles.goal}></i>Mục tiêu</span>
        </div>
      </div>
    );
  };

  const renderTable = () => {
    if (!overview || !overview.theoNgay) return null;
    return (
      <div id="table-box">
        <div className="table-wrap">
          <table className="data-table">
            <caption className="sr-only">Số liệu từng ngày</caption>
            <thead>
              <tr>
                <th scope="col">Ngày</th>
                <th scope="col" className={styles.num}>Lượt ôn</th>
                <th scope="col" className={styles.num}>Câu luyện</th>
                <th scope="col" className={styles.num}>Phút học</th>
                <th scope="col">Mục tiêu</th>
              </tr>
            </thead>
            <tbody>
              {[...overview.theoNgay].reverse().map((x, i) => {
                const isGoal = x.soPhut >= overview.mucTieuPhutNgay && x.soPhut > 0;
                return (
                  <tr key={i}>
                    <td>{formatDay(x.ngay, true)}{x.ngay === today ? ' (hôm nay)' : ''}</td>
                    <td className={styles.num}>{x.soLuotOn || 0}</td>
                    <td className={styles.num}>{x.soCauLuyen || 0}</td>
                    <td className={styles.num}>{x.soPhut || 0}</td>
                    <td>
                      {isGoal ? <span className="stamp stamp-success">Đạt</span> : (x.soLuotOn || x.soCauLuyen ? <span className="muted">Chưa đạt</span> : <span className="muted">Không học</span>)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="page page-grid with-side">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code">
            <span>Thống kê</span>
            <span id="tz">Múi giờ {tz}</span>
          </div>
          <h1 id="page-title">Thống kê học tập</h1>
          <p>Số liệu tính từ lượt ôn và bài luyện đã ghi nhận. Mỗi lượt chỉ tính một lần, ngày tính theo múi giờ của bạn.</p>
        </div>

        <form className={styles.filters} id="filters" noValidate onSubmit={handleApply}>
          <fieldset className="fieldset">
            <legend>Khoảng thời gian</legend>
            <div className={`choice-grid cols-3 ${styles.choiceGrid}`}>
              <label className="choice choice-card">
                <input type="radio" name="range" value="7" checked={rangeType === '7'} onChange={(e) => setRangeType(e.target.value)} />
                <span className="bubble" aria-hidden="true"></span>
                <span className="choice-body"><span className="choice-title">7 ngày</span></span>
              </label>
              <label className="choice choice-card">
                <input type="radio" name="range" value="30" checked={rangeType === '30'} onChange={(e) => setRangeType(e.target.value)} />
                <span className="bubble" aria-hidden="true"></span>
                <span className="choice-body"><span className="choice-title">30 ngày</span></span>
              </label>
              <label className="choice choice-card">
                <input type="radio" name="range" value="custom" checked={rangeType === 'custom'} onChange={(e) => setRangeType(e.target.value)} />
                <span className="bubble" aria-hidden="true"></span>
                <span className="choice-body"><span className="choice-title">Tự chọn</span></span>
              </label>
            </div>
          </fieldset>
          
          <div className={styles.dates} id="dates" hidden={rangeType !== 'custom'}>
            <div className="field" data-field="tuNgay">
              <label className="field-label" htmlFor="tuNgay">Từ ngày</label>
              <input className="input" type="date" id="tuNgay" name="tuNgay" value={tuNgay} onChange={e => setTuNgay(e.target.value)} max={today} />
              <p className="field-error"></p>
            </div>
            <div className="field" data-field="denNgay">
              <label className="field-label" htmlFor="denNgay">Đến ngày</label>
              <input className="input" type="date" id="denNgay" name="denNgay" value={denNgay} onChange={e => setDenNgay(e.target.value)} max={today} />
              <p className="field-error"></p>
            </div>
            <p className="field-hint" style={{ gridColumn: '1/-1' }}>Chọn tối đa 90 ngày.</p>
          </div>
          
          <div className={styles.foot}>
            <div className="field" data-field="boTheId">
              <label className="field-label" htmlFor="deck">Bộ thẻ</label>
              <select className="select" id="deck" name="boTheId" value={deckId} onChange={e => setDeckId(e.target.value)}>
                <option value="">Tất cả bộ của tôi</option>
                {myDecks?.items?.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <p className="field-error"></p>
            </div>
            <button type="submit" className="btn btn-primary" id="apply">Xem thống kê</button>
          </div>
        </form>

        <div data-view={overviewLoading ? "loading" : overviewError ? "error" : (overview?.theoNgay?.length > 0 ? "ready" : "empty")} id="region" aria-live="polite">
          <div data-when="loading">
            <div className="skeleton">
              <div className="sk sk-row"></div><div className="sk sk-row"></div><div className="sk sk-row"></div><div className="sk sk-row"></div>
            </div>
          </div>
          <div data-when="ready">
            <h2 className={styles.secTitle} style={{ marginTop: 0 }} id="range-title">Tổng quan {formatDay(overview?.tuNgay)} đến {formatDay(overview?.denNgay)}</h2>
            <dl className="tally cols-2" id="tally">
              <div><dt>Từ đã học</dt><dd>{overview?.soTuDaHoc || 0}</dd></div>
              <div><dt>Lượt ôn</dt><dd>{overview?.soLuotOn || 0}</dd></div>
              <div><dt>Tỷ lệ nhớ</dt><dd>{overview?.tyLeNho || 0}%</dd></div>
              <div><dt>Bài luyện</dt><dd>{overview?.baiLuyen?.soCauDung || 0}/{overview?.baiLuyen?.tongSoCau || 0} câu</dd></div>
              <div><dt>Thời gian học</dt><dd>{overview?.tongPhut || 0} phút</dd></div>
              <div><dt>Ngày đạt mục tiêu</dt><dd>{overview?.soNgayDatMucTieu || 0}/{overview?.soNgayCoHoc || 0} ngày</dd></div>
              <div><dt>Chuỗi ngày</dt><dd>{overview?.chuoiNgay || 0} ngày</dd></div>
            </dl>
            
            <div className={styles.secHead}>
              <h2 className={styles.secTitle} id="chart-title">Thời gian học theo ngày</h2>
              <button type="button" className="btn btn-quiet" id="toggle" aria-pressed={viewMode === 'table'} aria-controls="chart-box table-box" onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}>
                {viewMode === 'chart' ? 'Xem dạng bảng' : 'Xem dạng biểu đồ'}
              </button>
            </div>
            {viewMode === 'chart' ? renderChart() : renderTable()}
          </div>
          <div data-when="empty">
            <div className="empty">
              <div className="empty-sheet" aria-hidden="true">
                <span data-n="1"><i></i><i></i><i></i><i></i></span>
                <span data-n="2"><i></i><i></i><i></i><i></i></span>
              </div>
              <h2>Chưa có hoạt động trong khoảng này</h2>
              <p id="empty-text">Học hoặc làm bài luyện, số liệu sẽ hiện ở đây ngay sau khi được ghi nhận.</p>
              <Link className="btn btn-primary" href="/hom-nay">Về trang Hôm nay</Link>
            </div>
          </div>
          <div data-when="error">Lỗi tải dữ liệu.</div>
        </div>

        <h2 className={styles.secTitle}>Mức làm chủ theo kỹ năng</h2>
        <div data-view={skillsLoading ? "loading" : skillsError ? "error" : (skills?.length > 0 ? "ready" : "empty")} id="skills-region" aria-live="polite">
          <div data-when="loading">
            <div className="skeleton"><div className="sk sk-row"></div><div className="sk sk-row"></div></div>
          </div>
          <div data-when="ready">
            <div className="table-wrap">
              <table className="data-table">
                <caption className="sr-only">Mức làm chủ theo kỹ năng</caption>
                <thead>
                  <tr>
                    <th scope="col">Kỹ năng</th>
                    <th scope="col">Mức làm chủ</th>
                    <th scope="col" className={styles.num}>Đúng lần đầu</th>
                    <th scope="col" className={styles.num}>Đúng sau luyện lại</th>
                    <th scope="col" className={styles.num}>Lượt đã làm</th>
                  </tr>
                </thead>
                <tbody id="skills">
                  {skills?.map((s, i) => (
                    <tr key={i}>
                      <td>{ERROR_GROUP[s.kyNang] || s.kyNang}</td>
                      <td className={styles.skillCell}>
                        {s.duDuLieu ? (
                          <>
                            <div className={styles.skillPct}>{s.mucLamChu}%</div>
                            <div className="meter" aria-hidden="true"><i style={{ width: `${s.mucLamChu}%` }}></i></div>
                          </>
                        ) : (
                          <>
                            <span className="stamp stamp-quiet">Chưa đủ dữ liệu</span>
                            <div className="small muted" style={{ marginTop: '4px' }}>{s.soLuotTinh}/{s.soQuanSatToiThieu} lượt tối thiểu</div>
                          </>
                        )}
                      </td>
                      <td className={styles.num}>{s.tyLeDungLanDau !== null ? `${s.tyLeDungLanDau}%` : '—'}</td>
                      <td className={styles.num}>{s.tyLeDungSauLuyenLai !== null ? `${s.tyLeDungSauLuyenLai}%` : '—'}</td>
                      <td className={styles.num}>{s.soQuanSat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="small muted" style={{ marginTop: 'var(--sp-2)' }}>Mức làm chủ tính trên tối đa 20 lượt gần nhất, lượt mới nặng hơn. Cần ít nhất 5 lượt mới có kết quả.</p>
          </div>
          <div data-when="empty">
            <p className="small muted">Bạn chưa làm bài luyện nào. <Link href="/luyen-tap">Chọn dạng bài</Link></p>
          </div>
          <div data-when="error">Lỗi tải dữ liệu.</div>
        </div>
      </section>

      <aside className="side-col">
        <section className="panel" aria-labelledby="how-title">
          <h2 className="panel-title" id="how-title">Cách tính</h2>
          <ul className={styles.notes}>
            <li><strong>Từ đã học</strong>: số thẻ khác nhau có ít nhất một lượt ôn trong khoảng đã chọn.</li>
            <li><strong>Tỷ lệ nhớ</strong>: lượt chấm Khó, Nhớ hoặc Dễ trên tổng lượt ôn.</li>
            <li><strong>Thời gian học</strong>: tổng thời gian trả lời thẻ và làm bài luyện.</li>
            <li><strong>Chuỗi ngày</strong>: số ngày liên tiếp có ít nhất một phiên ôn từ 5 thẻ trở lên.</li>
            <li id="tz-note">Ngày được chia theo múi giờ của bạn.</li>
          </ul>
        </section>
        
        <section className="panel" aria-labelledby="next-title">
          <h2 className="panel-title" id="next-title">Luyện kỹ năng yếu</h2>
          {lowestSkill ? (
            <>
              <p className="small muted" id="weak">
                Kỹ năng yếu nhất hiện tại là <strong>{(ERROR_GROUP[lowestSkill.kyNang] || lowestSkill.kyNang).toLowerCase()}</strong> ({lowestSkill.mucLamChu}%).
                {thinSkills.length > 0 && ` Còn ${thinSkills.length} kỹ năng chưa đủ dữ liệu.`}
              </p>
              <Link className="btn btn-secondary" href={`/luyen-tap?loaiBai=${PRACTICE_MAP[lowestSkill.kyNang] || 'CHON_NGHIA'}`} style={{ marginTop: 'var(--sp-3)' }}>
                Luyện {(ERROR_GROUP[lowestSkill.kyNang] || lowestSkill.kyNang).toLowerCase()}
              </Link>
            </>
          ) : (
            <p className="small muted" id="weak">Làm thêm bài luyện để biết kỹ năng nào cần tập trung.</p>
          )}
        </section>
      </aside>
    </div>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ padding: 'var(--sp-6)' }}><div className="sk sk-row"></div></div>}>
      <StatsContent />
    </Suspense>
  );
}
