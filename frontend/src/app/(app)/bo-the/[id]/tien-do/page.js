'use client';
import { useState, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';
import { useMe } from '@/hooks/useMe';

const GROUPS = [
  { id: '', label: 'Tất cả' },
  { id: 'MOI', label: 'Mới' },
  { id: 'DANG_HOC', label: 'Đang học' },
  { id: 'DEN_HAN', label: 'Đến hạn' },
  { id: 'QUA_HAN', label: 'Quá hạn' },
  { id: 'TAM_NGUNG', label: 'Tạm ngưng' }
];

const STAMP = {
  MOI: { class: 'var(--color-desk)', text: 'var(--color-ink-2)' },
  DANG_HOC: { class: 'var(--color-border)', text: 'var(--color-ink)' },
  DEN_HAN: { class: 'var(--color-primary)', text: 'white' },
  QUA_HAN: { class: 'var(--color-warning-bg)', text: 'var(--color-warning-text)' },
  TAM_NGUNG: { class: 'var(--color-ink-3)', text: 'white' }
};

const DIR = { EN_VI: 'Anh → Việt', VI_EN: 'Việt → Anh' };
const SRS_STATE = { MOI: 'Mới', DANG_HOC: 'Đang học', ON_TAP: 'Ôn tập', HOC_LAI: 'Học lại', TAM_NGUNG: 'Tạm ngưng' };
const RATING = { QUEN: 'Quên', KHO: 'Khó', NHO: 'Nhớ', DE: 'Dễ' };

function HistoryLog({ theId }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['learning-history', theId],
    queryFn: () => apiFetch(\`/api/v1/learning/history?theId=\${theId}&size=10\`)
  });

  if (isLoading) return <div style={{ padding: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>Đang tải lịch sử...</div>;
  if (error) return <div style={{ padding: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-danger)' }}>Lỗi: {error.message}</div>;

  if (!data?.items?.length) {
    return <div style={{ padding: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Thẻ này chưa có lượt ôn nào.</div>;
  }

  return (
    <div style={{ marginTop: 'var(--space-2)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th style={{ padding: '4px' }}>Lúc</th>
            <th style={{ padding: '4px' }}>Chiều</th>
            <th style={{ padding: '4px' }}>Mức</th>
            <th style={{ padding: '4px' }}>Trước</th>
            <th style={{ padding: '4px' }}>Sau</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((r, i) => (
            <tr key={i} style={{ borderBottom: '1px dashed var(--color-border)' }}>
              <td style={{ padding: '4px' }}>{new Date(r.createdAt).toLocaleString('vi-VN')}</td>
              <td style={{ padding: '4px' }}>{DIR[r.chieuHoc] || r.chieuHoc}</td>
              <td style={{ padding: '4px' }}>{RATING[r.danhGia] || r.danhGia}</td>
              <td style={{ padding: '4px' }}>{SRS_STATE[r.truoc?.trangThai] || r.truoc?.trangThai || '-'}</td>
              <td style={{ padding: '4px' }}>{SRS_STATE[r.sau?.trangThai] || r.sau?.trangThai || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressContent({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { me } = useMe();
  
  // Use React.use() style unwrap for params since it might be a Promise in newer NextJS versions
  // However, Next 13/14 App Router allows direct access in Client Components typically.
  // We'll wrap in a hook if needed, but it's passed safely.
  const id = params.id;

  const defaultNhom = searchParams.get('nhom') || '';
  const defaultQ = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const [nhom, setNhom] = useState(defaultNhom);
  const [q, setQ] = useState(defaultQ);
  const [openHistory, setOpenHistory] = useState({}); // { [theId]: boolean }

  const { data, isLoading } = useQuery({
    queryKey: ['deck-progress', id, nhom, q, page],
    queryFn: () => {
      const urlParams = new URLSearchParams();
      if (nhom) urlParams.set('nhom', nhom);
      if (q) urlParams.set('q', q);
      urlParams.set('page', page.toString());
      urlParams.set('size', '20');
      return apiFetch(\`/api/v1/decks/\${encodeURIComponent(id)}/progress?\${urlParams.toString()}\`);
    }
  });

  const actionMutation = useMutation({
    mutationFn: ({ method, url, body }) => apiFetch(url, { method, body: body ? JSON.stringify(body) : undefined }),
    onSuccess: () => queryClient.invalidateQueries(['deck-progress', id])
  });

  const handleTabClick = (groupId) => {
    setNhom(groupId);
    const urlParams = new URLSearchParams(searchParams);
    if (groupId) urlParams.set('nhom', groupId); else urlParams.delete('nhom');
    urlParams.set('page', '0');
    router.push(\`/bo-the/\${id}/tien-do?\${urlParams.toString()}\`, { scroll: false });
  };

  const handleSearch = (val) => {
    setQ(val);
    const urlParams = new URLSearchParams(searchParams);
    if (val) urlParams.set('q', val); else urlParams.delete('q');
    urlParams.set('page', '0');
    router.push(\`/bo-the/\${id}/tien-do?\${urlParams.toString()}\`, { scroll: false });
  };

  const handlePageChange = (newPage) => {
    const urlParams = new URLSearchParams(searchParams);
    urlParams.set('page', newPage.toString());
    router.push(\`/bo-the/\${id}/tien-do?\${urlParams.toString()}\`, { scroll: false });
  };

  const getWhenStr = (c) => {
    if (c.nhom === 'MOI') return 'Chưa học';
    if (c.nhom === 'TAM_NGUNG') return 'Không vào phiên học';
    if (c.nhom === 'QUA_HAN') return \`Đến hạn từ \${new Date(c.hanOnAt).toLocaleDateString('vi-VN')}, đang trễ\`;
    if (c.nhom === 'DEN_HAN') return \`Đến hạn \${new Date(c.hanOnAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} hôm nay\`;
    return \`Ôn lại sau \${c.khoangHienThi}\`;
  };

  const renderDir = (dirCode, c) => {
    const st = STAMP[c.nhom] || STAMP['MOI'];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
        <span style={{ fontWeight: 'bold', color: 'var(--color-primary)', minWidth: '6.5rem' }}>{DIR[dirCode]}</span>
        <span style={{ padding: '2px 8px', background: st.class, color: st.text, borderRadius: '4px', fontWeight: 'bold' }}>{GROUPS.find(g => g.id === c.nhom)?.label}</span>
        {c.trangThai !== c.nhom && ['ON_TAP', 'HOC_LAI'].includes(c.trangThai) && <span>{SRS_STATE[c.trangThai]}</span>}
        <span>{getWhenStr(c)}</span>
        {c.soLanQuen ? <span>Quên {c.soLanQuen} lần</span> : null}
      </div>
    );
  };

  const handleSuspend = (theId, word, suspend) => {
    if (!window.confirm(\`\${suspend ? 'Tạm ngưng' : 'Khôi phục'} thẻ "\${word}"?\`)) return;
    actionMutation.mutate({
      method: 'PUT',
      url: \`/api/v1/cards/\${theId}/progress/suspend\`,
      body: { tamNgung: suspend }
    });
  };

  const handleReset = (theId, word) => {
    if (!window.confirm(\`Đặt lại tiến độ thẻ "\${word}"? Cả hai chiều sẽ quay về trạng thái Mới.\`)) return;
    actionMutation.mutate({
      method: 'POST',
      url: \`/api/v1/cards/\${theId}/progress/reset\`
    });
  };

  const toggleHistory = (theId) => {
    setOpenHistory(prev => ({ ...prev, [theId]: !prev[theId] }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid with-side">
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <Button variant="ghost" onClick={() => router.push(\`/bo-the/\${id}\`)} style={{ marginLeft: '-12px', marginBottom: 'var(--space-3)' }}>
          <Icon name="arrow-left" /> Về bộ thẻ
        </Button>
        
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)', justifyContent: 'space-between' }}>
            <span>Tiến độ bộ thẻ</span>
            {data && <span>Múi giờ {data.muiGio}</span>}
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>{data?.ten || 'Tiến độ'}</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>Mỗi thẻ có hai chiều học, mỗi chiều một lịch ôn riêng. Quá hạn nghĩa là trễ từ hôm trước trở đi.</p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          {GROUPS.map(g => {
            const count = data?.tongHop?.[g.id] || 0;
            return (
              <button 
                key={g.id} 
                onClick={() => handleTabClick(g.id)} 
                style={{ padding: '6px 12px', border: nhom === g.id ? 'none' : '1px solid var(--color-border)', background: nhom === g.id ? 'var(--color-primary)' : 'transparent', color: nhom === g.id ? 'white' : 'inherit', borderRadius: 'var(--radius-full)', fontWeight: 'bold', cursor: 'pointer', display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                {g.label}
                {g.id && count > 0 && <span style={{ background: nhom === g.id ? 'rgba(255,255,255,0.2)' : 'var(--color-border)', padding: '2px 6px', borderRadius: '10px', fontSize: '12px' }}>{count}</span>}
              </button>
            );
          })}
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ position: 'relative', maxWidth: '320px' }}>
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-3)', pointerEvents: 'none' }}>
              <Icon name="search" />
            </div>
            <input 
              type="search" 
              placeholder="Tìm từ hoặc nghĩa" 
              value={q} 
              onChange={e => handleSearch(e.target.value)} 
              style={{ width: '100%', padding: '10px 10px 10px 36px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} 
            />
          </div>
        </div>

        {isLoading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải tiến độ...</div>
        ) : data?.items?.length > 0 ? (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-4)' }}>
            {data.items.map((it, i) => (
              <li key={it.theId} style={{ display: 'flex', gap: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px dashed var(--color-border)' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)', marginTop: '4px' }}>{page * data.size + i + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '1.125rem' }}>{it.tu}</strong>
                    {it.phienAm && <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>{it.phienAm}</span>}
                    {it.tuLoai && <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>{it.tuLoai}</span>}
                  </div>
                  <div style={{ marginBottom: '12px' }}>{it.nghiaVi}</div>
                  
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {renderDir('EN_VI', it.chieu.EN_VI)}
                    {renderDir('VI_EN', it.chieu.VI_EN)}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                    {it.tamNgung ? (
                      <Button variant="secondary" size="sm" onClick={() => handleSuspend(it.theId, it.tu, false)}>Khôi phục</Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => handleSuspend(it.theId, it.tu, true)}>Tạm ngưng</Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleReset(it.theId, it.tu)} style={{ color: 'var(--color-danger)' }}>Đặt lại</Button>
                    <Button variant="ghost" size="sm" onClick={() => toggleHistory(it.theId)}>
                      {openHistory[it.theId] ? 'Ẩn lịch sử' : 'Lịch sử ôn'}
                    </Button>
                  </div>
                  
                  {openHistory[it.theId] && <HistoryLog theId={it.theId} />}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-3)' }}>Không có thẻ nào ở trạng thái này</h2>
            <p style={{ color: 'var(--color-ink-2)' }}>Chọn trạng thái khác hoặc xóa từ khóa tìm kiếm.</p>
          </div>
        )}
      </section>

      <aside style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>Tổng hợp, mỗi chiều tính riêng</h2>
          {data?.tongHop && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              {GROUPS.slice(1).map(g => (
                <div key={g.id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>{g.label}</span>
                  <div><strong style={{ fontSize: '1.375rem', marginRight: '4px' }}>{data.tongHop[g.id]}</strong><span style={{ fontSize: 'var(--font-size-xs)' }}>thẻ</span></div>
                </div>
              ))}
            </div>
          )}
          <Button variant="primary" onClick={() => router.push(\`/hoc?boTheId=\${id}\`)} style={{ width: '100%' }}>Học bộ này</Button>
        </section>

        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Tạm ngưng và đặt lại</h2>
          <ul style={{ paddingLeft: '20px', display: 'grid', gap: '8px', margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
            <li><strong>Tạm ngưng</strong>: thẻ không vào phiên học nữa. Khôi phục thì thẻ giữ nguyên lịch cũ, kể cả khi đã trễ.</li>
            <li><strong>Đặt lại</strong>: cả hai chiều quay về trạng thái Mới. Lịch sử ôn cũ vẫn được giữ.</li>
          </ul>
        </section>
      </aside>
    </div>
  );
}

export default function DeckProgressPage({ params }) {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <ProgressContent params={params} />
    </Suspense>
  );
}
