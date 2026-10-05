'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';
import { useMe } from '@/hooks/useMe';

const GOAL = { GIAO_TIEP: 'Giao tiếp', TOEIC: 'TOEIC', IELTS: 'IELTS' };
const LEVEL = { A1: 'A1 - Sơ cấp', A2: 'A2 - Sơ trung cấp', B1: 'B1 - Trung cấp', B2: 'B2 - Thượng trung cấp', C1: 'C1 - Cao cấp', C2: 'C2 - Thành thạo' };

function DeckDialog({ deck, topics, onClose, onSave }) {
  const [formData, setFormData] = useState({
    ten: deck?.ten || '',
    moTa: deck?.moTa || '',
    mucTieu: deck?.mucTieu || '',
    chuDeId: deck?.chuDeId || '',
    trinhDo: deck?.trinhDo || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ten || !formData.mucTieu || !formData.chuDeId || !formData.trinhDo) {
      alert('Vui lòng điền đủ các trường bắt buộc');
      return;
    }
    setLoading(true);
    try {
      const body = { ...formData };
      if (deck) body.version = deck.version;
      const res = await apiFetch(`/api/v1/admin/decks${deck ? `/${deck.id}` : ''}`, {
        method: deck ? 'PATCH' : 'POST',
        body: JSON.stringify(body)
      });
      onSave(res);
    } catch (err) {
      alert(err.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'var(--space-4)' }}>
      <form onSubmit={handleSubmit} style={{ background: 'var(--color-bg)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-4)' }}>{deck ? 'Sửa thông tin bộ' : 'Tạo bộ mẫu'}</h2>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Tên bộ *</label>
          <input required type="text" value={formData.ten} onChange={e => setFormData({ ...formData, ten: e.target.value })} maxLength={170} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
        </div>

        <div style={{ marginBottom: 'var(--space-4)' }}>
          <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Mô tả</label>
          <textarea value={formData.moTa} onChange={e => setFormData({ ...formData, moTa: e.target.value })} rows={3} maxLength={1100} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Mục tiêu *</label>
            <select required value={formData.mucTieu} onChange={e => setFormData({ ...formData, mucTieu: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              <option value="">Chọn</option>
              {Object.entries(GOAL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Chủ đề *</label>
            <select required value={formData.chuDeId} onChange={e => setFormData({ ...formData, chuDeId: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              <option value="">Chọn</option>
              {topics?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>Trình độ *</label>
            <select required value={formData.trinhDo} onChange={e => setFormData({ ...formData, trinhDo: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }}>
              <option value="">Chọn</option>
              {Object.entries(LEVEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        {!deck && <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)' }}>Bộ mới ở trạng thái nháp. Thêm thẻ rồi xuất bản.</p>}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={loading}>{deck ? 'Lưu thông tin' : 'Tạo bộ'}</Button>
        </div>
      </form>
    </div>
  );
}

function CardDialog({ card, deckId, onClose, onSave }) {
  const [formData, setFormData] = useState({
    tu: card?.tu || '',
    nghiaVi: card?.nghiaVi || '',
    tuLoai: card?.tuLoai || '',
    phienAm: card?.phienAm || '',
    viDuEn: card?.viDuEn || '',
    dichVi: card?.dichVi || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.tu || !formData.nghiaVi) {
      alert('Vui lòng nhập Từ và Nghĩa');
      return;
    }
    setLoading(true);
    try {
      const body = { ...formData };
      if (card) body.version = card.version;
      else body.boTheId = deckId;

      const res = await apiFetch(`/api/v1/admin/cards${card ? `/${card.id}` : ''}`, {
        method: card ? 'PATCH' : 'POST',
        body: JSON.stringify(body)
      });
      onSave(res);
    } catch (err) {
      alert(err.message || 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 'var(--space-4)' }}>
      <form onSubmit={handleSubmit} style={{ background: 'var(--color-bg)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-4)' }}>{card ? `Sửa thẻ ${card.tu}` : 'Thêm thẻ'}</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          {[
            { key: 'tu', label: 'Từ hoặc cụm từ *', max: 120 },
            { key: 'nghiaVi', label: 'Nghĩa tiếng Việt *', max: 520 },
            { key: 'tuLoai', label: 'Từ loại', max: 40 },
            { key: 'phienAm', label: 'Phiên âm', max: 120 },
            { key: 'viDuEn', label: 'Ví dụ tiếng Anh', max: 320 },
            { key: 'dichVi', label: 'Dịch ví dụ', max: 320 }
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>{f.label}</label>
              <input type="text" value={formData[f.key]} onChange={e => setFormData({ ...formData, [f.key]: e.target.value })} maxLength={f.max} style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={loading}>{card ? 'Lưu thẻ' : 'Thêm thẻ'}</Button>
        </div>
      </form>
    </div>
  );
}

function AdminDecksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { me } = useMe();

  const id = searchParams.get('id');
  const defaultQ = searchParams.get('q') || '';
  const defaultStatus = searchParams.get('trangThai') || '';
  const page = parseInt(searchParams.get('page') || '0', 10);

  const [q, setQ] = useState(defaultQ);
  const [trangThai, setTrangThai] = useState(defaultStatus);
  const [showDeckDialog, setShowDeckDialog] = useState(false);
  const [editingDeck, setEditingDeck] = useState(null);
  const [editingCard, setEditingCard] = useState(null);

  const { data: topics } = useQuery({
    queryKey: ['admin-topics'],
    queryFn: () => apiFetch('/api/v1/admin/topics')
  });

  const { data: listData, isLoading: listLoading } = useQuery({
    queryKey: ['admin-decks', q, trangThai, page],
    queryFn: () => apiFetch(`/api/v1/admin/decks?q=${encodeURIComponent(q)}&trangThai=${trangThai}&page=${page}&size=20`),
    enabled: !id
  });

  const { data: deckDetail, isLoading: deckLoading } = useQuery({
    queryKey: ['admin-deck', id],
    queryFn: () => apiFetch(`/api/v1/admin/decks/${id}`),
    enabled: !!id
  });

  const { data: cards, isLoading: cardsLoading } = useQuery({
    queryKey: ['admin-cards', id],
    queryFn: () => apiFetch(`/api/v1/admin/cards?boTheId=${id}`),
    enabled: !!id
  });

  const actionMutation = useMutation({
    mutationFn: ({ method, url, body }) => apiFetch(url, { method, body: body ? JSON.stringify(body) : undefined }),
    onSuccess: (res, vars) => {
      if (vars.url.includes('/admin/cards')) {
        queryClient.invalidateQueries({ queryKey: ['admin-cards', id] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['admin-decks'] });
        if (id) queryClient.invalidateQueries({ queryKey: ['admin-deck', id] });
      }
    },
    onError: (err) => alert(err.message || 'Lỗi')
  });

  const promptReason = () => {
    const reason = window.prompt('Nhập lý do thực hiện thao tác (bắt buộc):');
    return reason?.trim();
  };

  const handleDeckAction = (act, d) => {
    let method, url, body;
    url = `/api/v1/admin/decks/${d.id}`;

    if (act === 'publish') {
      if (!window.confirm(`Xuất bản ${d.ten}?`)) return;
      method = 'PATCH'; body = { quyenTruyCap: 'CONG_KHAI', version: d.version };
    } else if (act === 'draft') {
      if (!window.confirm(`Chuyển ${d.ten} về nháp?`)) return;
      const lyDo = promptReason();
      if (!lyDo) return;
      method = 'PATCH'; body = { quyenTruyCap: 'RIENG_TU', lyDo, version: d.version };
    } else if (act === 'hide') {
      if (!window.confirm(`Ẩn ${d.ten} khỏi thư viện?`)) return;
      const lyDo = promptReason();
      if (!lyDo) return;
      method = 'PATCH'; body = { trangThaiKiemDuyet: 'DA_AN', lyDo, version: d.version };
    } else if (act === 'show') {
      if (!window.confirm(`Hiện lại ${d.ten}?`)) return;
      const lyDo = promptReason();
      if (!lyDo) return;
      method = 'PATCH'; body = { trangThaiKiemDuyet: 'BINH_THUONG', lyDo, version: d.version };
    } else if (act === 'delete') {
      if (!window.confirm(`Xóa ${d.ten}?`)) return;
      const lyDo = promptReason();
      if (!lyDo) return;
      method = 'DELETE'; body = { lyDo };
    }

    if (method) {
      actionMutation.mutate({ method, url, body }, {
        onSuccess: () => {
          if (act === 'delete') {
            router.push('/quan-tri/bo-mau');
          }
        }
      });
    }
  };

  const handleDeleteCard = (c) => {
    if (!window.confirm(`Xóa thẻ ${c.tu}?`)) return;
    actionMutation.mutate({ method: 'DELETE', url: `/api/v1/admin/cards/${c.id}` });
  };

  if (!me?.vaiTro?.includes('ADMIN')) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Không có quyền truy cập</div>;

  const renderDeckMeta = (d) => {
    let stText = d.quyenTruyCap === 'CONG_KHAI' ? 'Đã xuất bản' : 'Bản nháp';
    let stClass = d.quyenTruyCap === 'CONG_KHAI' ? '' : 'var(--color-ink-3)';
    if (d.trangThaiKiemDuyet === 'DA_AN') {
      stText = 'Đã ẩn';
      stClass = 'var(--color-warning-text)';
    }
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)', alignItems: 'center' }}>
        <span style={{ padding: '2px 8px', background: 'var(--color-border)', color: stClass || 'inherit', borderRadius: '4px', fontWeight: 'bold' }}>{stText}</span>
        <span>{GOAL[d.mucTieu]}</span>
        <span>{d.chuDeTen || 'Chưa có chủ đề'}</span>
        <span>{LEVEL[d.trinhDo]}</span>
        <span>{d.soThe} thẻ</span>
        <span>{d.soBanSao} bản sao</span>
        <span>Sửa {new Date(d.updatedAt).toLocaleDateString('vi-VN')}</span>
      </div>
    );
  };

  const renderDeckTools = (d, isList) => {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: 'var(--space-3)' }}>
        {isList && <Button variant="ghost" size="sm" onClick={() => router.push(`/quan-tri/bo-mau?id=${d.id}`)}>Quản lý thẻ</Button>}
        <Button variant="ghost" size="sm" onClick={() => { setEditingDeck(d); setShowDeckDialog(true); }}>Sửa thông tin</Button>
        {d.trangThaiKiemDuyet !== 'DA_AN' && (
          <Button variant="ghost" size="sm" onClick={() => handleDeckAction(d.quyenTruyCap === 'CONG_KHAI' ? 'draft' : 'publish', d)} disabled={actionMutation.isPending}>
            {d.quyenTruyCap === 'CONG_KHAI' ? 'Chuyển về nháp' : 'Xuất bản'}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => handleDeckAction(d.trangThaiKiemDuyet === 'DA_AN' ? 'show' : 'hide', d)} disabled={actionMutation.isPending}>
          {d.trangThaiKiemDuyet === 'DA_AN' ? 'Hiện lại' : 'Ẩn khỏi thư viện'}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => handleDeckAction('delete', d)} style={{ color: 'var(--color-danger)' }} disabled={actionMutation.isPending}>Xóa bộ</Button>
      </div>
    );
  };

  if (id) {
    if (deckLoading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid with-side">
        <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <Button variant="ghost" onClick={() => router.push('/quan-tri/bo-mau')} style={{ marginLeft: '-12px', marginBottom: 'var(--space-4)' }}>
            <Icon name="arrow-left" /> Tất cả bộ mẫu
          </Button>

          {deckDetail && (
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>{deckDetail.ten}</h1>
              {renderDeckMeta(deckDetail)}
              {renderDeckTools(deckDetail, false)}
            </div>
          )}

          <div style={{ padding: 'var(--space-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-5)' }}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-3)' }}>Thêm thẻ nhanh</h2>
            <Button variant="primary" onClick={() => setEditingCard({})} disabled={actionMutation.isPending}>Thêm thẻ mới</Button>
          </div>

          <h2 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-3)' }}>Danh sách thẻ</h2>
          {cardsLoading ? (
            <div style={{ padding: 'var(--space-4)', textAlign: 'center' }}>Đang tải thẻ...</div>
          ) : cards?.length > 0 ? (
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-3)' }}>
              {cards.map((c, i) => (
                <li key={c.id} style={{ display: 'flex', gap: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px dashed var(--color-border)' }}>
                  <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)', marginTop: '4px' }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'baseline', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '1.125rem' }}>{c.tu}</strong>
                      {c.phienAm && <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>{c.phienAm}</span>}
                      {c.tuLoai && <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>{c.tuLoai}</span>}
                    </div>
                    <div>{c.nghiaVi}</div>
                    {c.viDuEn && (
                      <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginTop: '4px' }}>
                        <div>{c.viDuEn}</div>
                        {c.dichVi && <div>{c.dichVi}</div>}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'var(--space-2)' }}>
                      <Button variant="ghost" size="sm" onClick={() => setEditingCard(c)}>Sửa thẻ</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteCard(c)} style={{ color: 'var(--color-danger)' }}>Xóa thẻ</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)' }}>
              <h3>Bộ chưa có thẻ</h3>
              <p style={{ color: 'var(--color-ink-2)' }}>Thêm ít nhất một thẻ để xuất bản bộ.</p>
            </div>
          )}
        </section>

        <aside style={{ display: 'grid', gap: 'var(--space-5)' }}>
          <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Quy tắc</h2>
            <ul style={{ paddingLeft: '20px', display: 'grid', gap: '8px', margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
              <li>Bộ mới luôn ở trạng thái nháp, chỉ quản trị viên thấy.</li>
              <li>Chỉ xuất bản được bộ có ít nhất một thẻ. Bộ đang xuất bản không xóa được thẻ cuối.</li>
              <li>Chuyển về nháp, ẩn, hiện lại và xóa cần lý do, ghi vào nhật ký.</li>
              <li>Ẩn bộ sẽ gỡ khỏi thư viện. Bản sao người học đã lưu vẫn giữ nguyên.</li>
            </ul>
          </section>
        </aside>

        {editingCard !== null && (
          <CardDialog
            card={Object.keys(editingCard).length === 0 ? null : editingCard}
            deckId={id}
            onClose={() => setEditingCard(null)}
            onSave={() => { setEditingCard(null); queryClient.invalidateQueries({ queryKey: ['admin-cards', id] }); queryClient.invalidateQueries({ queryKey: ['admin-deck', id] }); }}
          />
        )}
        {showDeckDialog && (
          <DeckDialog deck={editingDeck} topics={topics} onClose={() => { setShowDeckDialog(false); setEditingDeck(null); }} onSave={() => { setShowDeckDialog(false); setEditingDeck(null); queryClient.invalidateQueries({ queryKey: ['admin-deck', id] }); }} />
        )}
      </div>
    );
  }

  // List View
  const handleTabClick = (st) => {
    setTrangThai(st);
    const params = new URLSearchParams(searchParams);
    if (st) params.set('trangThai', st); else params.delete('trangThai');
    params.set('page', '0');
    router.push(`/quan-tri/bo-mau?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (q) params.set('q', q); else params.delete('q');
    params.set('page', '0');
    router.push(`/quan-tri/bo-mau?${params.toString()}`, { scroll: false });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid with-side">
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)', justifyContent: 'space-between' }}>
            <span>Quản trị</span>
            <span>{listData?.totalElements !== undefined ? `${listData.totalElements} bộ` : '—'}</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>Bộ và thẻ mẫu</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>Bộ mẫu là nội dung của nhóm biên soạn, hiện trong thư viện khi đã xuất bản. Người học sao chép về để học.</p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', overflowX: 'auto', paddingBottom: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          {[
            { id: '', label: 'Tất cả' },
            { id: 'BAN_NHAP', label: 'Bản nháp' },
            { id: 'DA_XUAT_BAN', label: 'Đã xuất bản' },
            { id: 'DA_AN', label: 'Đã ẩn' }
          ].map(t => (
            <button key={t.id} onClick={() => handleTabClick(t.id)} style={{ padding: '6px 12px', border: trangThai === t.id ? 'none' : '1px solid var(--color-border)', background: trangThai === t.id ? 'var(--color-primary)' : 'transparent', color: trangThai === t.id ? 'white' : 'inherit', borderRadius: 'var(--radius-full)', fontWeight: 'bold', cursor: 'pointer' }}>
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
          <div style={{ flex: 1 }}>
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Tìm theo tên bộ..." style={{ width: '100%', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }} />
          </div>
          <Button type="submit" variant="secondary">Tìm</Button>
          <Button type="button" variant="primary" onClick={() => { setEditingDeck(null); setShowDeckDialog(true); }}>Tạo bộ mẫu</Button>
        </form>

        {listLoading ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>
        ) : listData?.items?.length > 0 ? (
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-4)' }}>
            {listData.items.map((d, i) => (
              <li key={d.id} style={{ display: 'flex', gap: 'var(--space-4)', paddingBottom: 'var(--space-4)', borderBottom: '1px dashed var(--color-border)' }}>
                <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)', marginTop: '4px' }}>{page * listData.size + i + 1}</div>
                <div style={{ flex: 1 }}>
                  <Link href={`/quan-tri/bo-mau?id=${d.id}`} style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'inherit', textDecoration: 'none' }}>{d.ten}</Link>
                  {d.moTa && <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginTop: '4px', marginBottom: '8px' }}>{d.moTa}</div>}
                  <div style={{ marginTop: '8px' }}>{renderDeckMeta(d)}</div>
                  {renderDeckTools(d, true)}
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', background: 'var(--color-bg)', borderRadius: 'var(--radius-lg)' }}>
            <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-3)' }}>Chưa có bộ mẫu nào</h2>
            <p style={{ color: 'var(--color-ink-2)' }}>Tạo bộ ở trạng thái nháp, thêm thẻ rồi xuất bản.</p>
          </div>
        )}
      </section>

      <aside style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Nhật ký</h2>
          <Button variant="ghost" onClick={() => router.push('/quan-tri/nhat-ky?loai=BO_THE')} style={{ marginLeft: '-12px' }}>Mở nhật ký bộ mẫu</Button>
        </section>
      </aside>

      {showDeckDialog && (
        <DeckDialog deck={editingDeck} topics={topics} onClose={() => { setShowDeckDialog(false); setEditingDeck(null); }} onSave={(d) => { setShowDeckDialog(false); setEditingDeck(null); if (!editingDeck) { router.push(`/quan-tri/bo-mau?id=${d.id}`); } else { queryClient.invalidateQueries({ queryKey: ['admin-decks'] }); } }} />
      )}
    </div>
  );
}

export default function AdminDecksPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <AdminDecksContent />
    </Suspense>
  );
}
