'use client';
import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

const SKILL = {
  NHAN_NGHIA: 'Nhận nghĩa',
  VIET: 'Viết đúng chính tả',
  NGHE: 'Nghe và viết',
  NGU_CANH: 'Dùng từ trong câu',
  CAP_NHAM: 'Phân biệt cặp dễ nhầm'
};

const SKILL_TYPE = {
  NHAN_NGHIA: 'CHON_NGHIA',
  VIET: 'NHAP_TU_THEO_NGHIA',
  NGHE: 'NGHE_VIET',
  NGU_CANH: 'DIEN_CHO_TRONG',
  CAP_NHAM: 'PHAN_BIET_CAP'
};

const PRACTICE_MAP = {
  CHON_NGHIA: 'Chọn nghĩa',
  NHAP_TU_THEO_NGHIA: 'Nhập từ theo nghĩa',
  NGHE_VIET: 'Nghe viết',
  DIEN_CHO_TRONG: 'Điền chỗ trống',
  PHAN_BIET_CAP: 'Phân biệt cặp dễ nhầm'
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
    queryFn: () => apiFetch('/api/v1/decks/my-decks')
  });

  const { data: overview, isLoading: overviewLoading, refetch: refetchOverview } = useQuery({
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
      return apiFetch(\`/api/v1/statistics/overview?tuNgay=\${qTu}&denNgay=\${qDen}\${deckId ? \`&boTheId=\${deckId}\` : ''}\`);
    }
  });

  const { data: skills, isLoading: skillsLoading } = useQuery({
    queryKey: ['stats-skills', deckId],
    queryFn: () => apiFetch(\`/api/v1/statistics/skills\${deckId ? \`?boTheId=\${deckId}\` : ''}\`)
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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid with-side">
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)', justifyContent: 'space-between' }}>
            <span>Thống kê</span>
            <span>Múi giờ {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>Thống kê học tập</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>Số liệu tính từ lượt ôn và bài luyện đã ghi nhận. Mỗi lượt chỉ tính một lần, ngày tính theo múi giờ của bạn.</p>
        </div>

        <form onSubmit={handleApply} style={{ paddingBottom: 'var(--space-5)', marginBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)', display: 'grid', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>Khoảng thời gian</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
              {[
                { val: '7', label: '7 ngày' },
                { val: '30', label: '30 ngày' },
                { val: 'custom', label: 'Tự chọn' }
              ].map(opt => (
                <label key={opt.val} style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: rangeType === opt.val ? 'var(--color-primary-tint)' : 'transparent' }}>
                  <input type="radio" name="range" value={opt.val} checked={rangeType === opt.val} onChange={(e) => setRangeType(e.target.value)} />
                  <span style={{ fontWeight: 'bold' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {rangeType === 'custom' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: '4px' }}>Từ ngày</label>
                <input type="date" value={tuNgay} onChange={e => setTuNgay(e.target.value)} max={today} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: '4px' }}>Đến ngày</label>
                <input type="date" value={denNgay} onChange={e => setDenNgay(e.target.value)} max={today} style={{ width: '100%', padding: '8px', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
              </div>
              <div style={{ gridColumn: '1 / -1', fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)' }}>Chọn tối đa 90 ngày.</div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', fontWeight: 'bold', marginBottom: '4px' }}>Bộ thẻ</label>
              <select value={deckId} onChange={e => setDeckId(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
                <option value="">Tất cả bộ của tôi</option>
                {myDecks?.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="primary">Xem thống kê</Button>
          </div>
        </form>

        {overviewLoading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải tổng quan...</div>
        ) : overview?.theoNgay?.length > 0 ? (
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-4)' }}>Tổng quan {formatDay(overview.tuNgay)} đến {formatDay(overview.denNgay)}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
              {[
                { title: 'Từ đã học', desc: 'thẻ có lượt ôn', val: overview.soTuDaHoc, unit: 'từ' },
                { title: 'Lượt ôn', desc: 'mỗi chiều tính riêng', val: overview.soLuotOn, unit: 'lượt' },
                { title: 'Tỷ lệ nhớ', desc: 'Khó, Nhớ, Dễ trên tổng lượt', val: \`\${overview.tyLeNho}%\`, unit: '' },
                { title: 'Bài luyện', desc: \`\${overview.baiLuyen.soBai} bài, \${overview.baiLuyen.soCauDung}/\${overview.baiLuyen.tongSoCau} câu đúng\`, val: \`\${overview.baiLuyen.tyLeDung}%\`, unit: 'đúng' },
                { title: 'Thời gian học', desc: \`mục tiêu \${overview.mucTieuPhutNgay} phút mỗi ngày\`, val: overview.tongPhut, unit: 'phút' },
                { title: 'Ngày đạt mục tiêu', desc: \`có học \${overview.soNgayCoHoc}/\${overview.theoNgay.length} ngày\`, val: \`\${overview.soNgayDatMucTieu}/\${overview.theoNgay.length}\`, unit: 'ngày' },
                { title: 'Chuỗi ngày hiện tại', desc: 'tính đến hôm nay', val: overview.chuoiNgay, unit: 'ngày' }
              ].map((stat, idx) => (
                <div key={idx} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                  <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}>{stat.title}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)', marginBottom: '8px' }}>{stat.desc}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary-strong)' }}>{stat.val} <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--color-ink-2)' }}>{stat.unit}</span></div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
              <h2 style={{ fontSize: '1.25rem' }}>Thời gian học theo ngày</h2>
              <Button variant="ghost" onClick={() => setViewMode(viewMode === 'chart' ? 'table' : 'chart')}>
                {viewMode === 'chart' ? 'Xem dạng bảng' : 'Xem dạng biểu đồ'}
              </Button>
            </div>

            {viewMode === 'chart' ? (
              <div style={{ height: '240px', background: 'var(--color-bg)', padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
                <div style={{ display: 'flex', height: '180px', alignItems: 'flex-end', gap: '4px' }}>
                  {overview.theoNgay.map((d, i) => {
                    const maxScale = Math.max(overview.mucTieuPhutNgay, ...overview.theoNgay.map(x => x.soPhut), 1);
                    const scale = Math.ceil(maxScale * 1.2);
                    const h = (d.soPhut / scale) * 100;
                    const isGoal = d.soPhut >= overview.mucTieuPhutNgay && d.soPhut > 0;
                    return (
                      <div key={i} style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', title: \`\${formatDay(d.ngay, true)}: \${d.soPhut} phút\` }}>
                        <div style={{ width: '100%', height: \`\${h}%\`, background: isGoal ? 'var(--color-secondary)' : 'var(--color-ink-3)', transition: 'height 0.3s' }}></div>
                      </div>
                    );
                  })}
                </div>
                {/* Goal Line */}
                {(() => {
                  const maxScale = Math.max(overview.mucTieuPhutNgay, ...overview.theoNgay.map(x => x.soPhut), 1);
                  const scale = Math.ceil(maxScale * 1.2);
                  const h = (overview.mucTieuPhutNgay / scale) * 100;
                  return (
                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: \`calc(20px + \${(180 * h / 100)}px)\`, borderTop: '2px dashed var(--color-danger)', pointerEvents: 'none', zIndex: 1 }}>
                      <span style={{ position: 'absolute', right: '0', bottom: '2px', fontSize: '10px', background: 'var(--color-field)', padding: '0 4px', color: 'var(--color-danger)', fontWeight: 'bold' }}>Mục tiêu {overview.mucTieuPhutNgay}p</span>
                    </div>
                  );
                })()}
                {/* X Axis labels */}
                <div style={{ display: 'flex', marginTop: '8px', gap: '4px' }}>
                  {overview.theoNgay.map((d, i) => {
                    const showLabel = i % Math.ceil(overview.theoNgay.length / 5) === 0 || i === overview.theoNgay.length - 1;
                    return (
                      <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: '10px', color: 'var(--color-ink-2)' }}>
                        {showLabel ? formatDay(d.ngay) : ''}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Ngày</th>
                    <th style={{ padding: '8px' }}>Lượt ôn</th>
                    <th style={{ padding: '8px' }}>Câu luyện</th>
                    <th style={{ padding: '8px' }}>Phút học</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Mục tiêu</th>
                  </tr>
                </thead>
                <tbody>
                  {[...overview.theoNgay].reverse().map((x, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', textAlign: 'left' }}>{formatDay(x.ngay, true)} {x.ngay === today && '(hôm nay)'}</td>
                      <td style={{ padding: '8px' }}>{x.soLuotOn}</td>
                      <td style={{ padding: '8px' }}>{x.soCauLuyen}</td>
                      <td style={{ padding: '8px' }}>{x.soPhut}</td>
                      <td style={{ padding: '8px', textAlign: 'left' }}>
                        {x.soPhut >= overview.mucTieuPhutNgay && x.soPhut > 0 
                          ? <span style={{ padding: '2px 8px', background: 'var(--color-success-bg)', color: 'var(--color-success-text)', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}><Icon name="check" size={12}/> Đạt</span> 
                          : (x.soLuotOn || x.soCauLuyen ? 'Chưa đạt' : 'Không học')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-6)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-3)' }}>Chưa có hoạt động trong khoảng này</h2>
            <p style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)' }}>Học hoặc làm bài luyện, số liệu sẽ hiện ở đây ngay sau khi được ghi nhận.</p>
            <Button variant="primary" onClick={() => router.push('/hom-nay')}>Về trang Hôm nay</Button>
          </div>
        )}

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-4)' }}>Mức làm chủ theo kỹ năng</h2>
          {skillsLoading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>
          ) : skills?.length > 0 ? (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', marginBottom: 'var(--space-3)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Kỹ năng</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Mức làm chủ</th>
                    <th style={{ padding: '8px' }}>Đúng lần đầu</th>
                    <th style={{ padding: '8px' }}>Đúng sau luyện lại</th>
                    <th style={{ padding: '8px' }}>Lượt đã làm</th>
                  </tr>
                </thead>
                <tbody>
                  {skills.map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', textAlign: 'left', fontWeight: 'bold' }}>{SKILL[s.kyNang] || s.kyNang}</td>
                      <td style={{ padding: '8px', textAlign: 'left' }}>
                        {s.duDuLieu ? (
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{s.mucLamChu}%</div>
                            <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '3px', marginTop: '4px' }}>
                              <div style={{ height: '100%', background: 'var(--color-primary)', width: \`\${s.mucLamChu}%\`, borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span style={{ padding: '2px 8px', background: 'var(--color-border)', borderRadius: '4px', fontSize: '12px' }}>Chưa đủ dữ liệu</span>
                            <div style={{ fontSize: '11px', color: 'var(--color-ink-2)', marginTop: '4px' }}>{s.soLuotTinh}/{s.soQuanSatToiThieu} lượt tối thiểu</div>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '8px' }}>{s.tyLeDungLanDau !== null ? \`\${s.tyLeDungLanDau}%\` : '—'}</td>
                      <td style={{ padding: '8px' }}>{s.tyLeDungSauLuyenLai !== null ? \`\${s.tyLeDungSauLuyenLai}%\` : '—'}</td>
                      <td style={{ padding: '8px' }}>{s.soQuanSat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)' }}>Mức làm chủ tính trên tối đa 20 lượt gần nhất, lượt mới nặng hơn. Cần ít nhất 5 lượt mới có kết quả.</p>
            </>
          ) : (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Bạn chưa làm bài luyện nào. <Link href="/luyen-tap" style={{ color: 'var(--color-primary)' }}>Chọn dạng bài</Link></p>
          )}
        </div>

      </section>

      <aside style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>Cách tính</h2>
          <ul style={{ paddingLeft: '20px', display: 'grid', gap: '8px', margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
            <li><strong>Từ đã học</strong>: số thẻ khác nhau có ít nhất một lượt ôn trong khoảng đã chọn.</li>
            <li><strong>Tỷ lệ nhớ</strong>: lượt chấm Khó, Nhớ hoặc Dễ trên tổng lượt ôn.</li>
            <li><strong>Thời gian học</strong>: tổng thời gian trả lời thẻ và làm bài luyện.</li>
            <li><strong>Chuỗi ngày</strong>: số ngày liên tiếp có ít nhất một phiên ôn từ 5 thẻ trở lên.</li>
            <li>Ngày được chia theo múi giờ trong hồ sơ của bạn.</li>
          </ul>
        </section>

        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Luyện kỹ năng yếu</h2>
          {lowestSkill ? (
            <>
              <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
                Kỹ năng thấp nhất hiện tại là <strong>{SKILL[lowestSkill.kyNang].toLowerCase()} ({lowestSkill.mucLamChu}%)</strong>.
                {thinSkills.length > 0 && \` Còn \${thinSkills.length} kỹ năng chưa đủ dữ liệu.\`}
              </p>
              <Button variant="secondary" onClick={() => router.push(\`/luyen-tap?loaiBai=\${SKILL_TYPE[lowestSkill.kyNang]}\`)} style={{ marginTop: '12px' }}>
                Luyện {PRACTICE_MAP[SKILL_TYPE[lowestSkill.kyNang]]?.toLowerCase()}
              </Button>
            </>
          ) : (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Làm thêm bài luyện để biết kỹ năng nào cần tập trung.</p>
          )}
        </section>
      </aside>
    </div>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <StatsContent />
    </Suspense>
  );
}
