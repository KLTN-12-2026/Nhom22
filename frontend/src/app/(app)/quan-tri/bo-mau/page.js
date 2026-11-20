'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { Button, ErrorState, Icon, useToast } from '@/components/ui';
import { AdminTable } from '@/components/admin/AdminTable';
import { AdminPageHead, Pill } from '@/components/admin/AdminPageHead';
import { useAdminConfirm } from '@/components/admin/AdminConfirm';
import { setParams } from '@/lib/admin-table.mjs';
import { useMe } from '@/hooks/useMe';

const GOAL = { GIAO_TIEP: 'Giao tiếp', TOEIC: 'TOEIC' };
const LEVEL = { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' };

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
              {topics?.map(t => <option key={t.id} value={t.id}>{t.ten}</option>)}
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

      const res = await apiFetch(card ? `/api/v1/admin/cards/${card.id}` : `/api/v1/admin/decks/${deckId}/cards`, {
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

function deckState(d) {
  if (d.trangThaiKiemDuyet === 'DA_AN') return ['Đã ẩn', 'bad'];
  return d.quyenTruyCap === 'CONG_KHAI' ? ['Đã xuất bản', 'ok'] : ['Bản nháp', 'mute'];
}

const DECK_TABS = [['', 'Tất cả'], ['BAN_NHAP', 'Bản nháp'], ['DA_XUAT_BAN', 'Đã xuất bản'], ['DA_AN', 'Đã ẩn']];
const PAGE_SIZE = 20;

function AdminDecksContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { confirm, dialog } = useAdminConfirm();
  const { data: me } = useMe();

  const id = searchParams.get('id');
  const q = searchParams.get('q') || '';
  const trangThai = searchParams.get('trangThai') || '';
  const page = Math.max(0, Number.parseInt(searchParams.get('page') || '0', 10) || 0);
  const go = changes => router.replace(`${pathname}${setParams(searchParams, changes)}`, { scroll: false });

  const [search, setSearch] = useState(q);
  const [showDeckDialog, setShowDeckDialog] = useState(false);
  const [editingDeck, setEditingDeck] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [busy, setBusy] = useState(false);

  const { data: topics } = useQuery({ queryKey: ['admin-topics'], queryFn: () => fetchAllPages('/api/v1/admin/topics') });

  const list = useQuery({
    queryKey: ['admin-decks', q, trangThai, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
      if (q) params.set('q', q);
      if (trangThai) params.set('trangThai', trangThai);
      return apiFetch(`/api/v1/admin/decks?${params}`);
    },
    enabled: !id,
    placeholderData: previous => previous,
  });
  const deck = useQuery({ queryKey: ['admin-deck', id], queryFn: () => apiFetch(`/api/v1/admin/decks/${id}`), enabled: !!id });
  const cards = useQuery({ queryKey: ['admin-cards', id], queryFn: () => fetchAllPages(`/api/v1/admin/decks/${id}/cards`), enabled: !!id });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-decks'] });
    if (id) {
      queryClient.invalidateQueries({ queryKey: ['admin-deck', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-cards', id] });
    }
  };

  async function deckAction(act, d) {
    const spec = {
      publish: { title: 'Xuất bản bộ mẫu', message: `“${d.ten}” sẽ hiện trong thư viện cho mọi người học.`, confirmLabel: 'Xuất bản', reason: false, method: 'PATCH', body: { quyenTruyCap: 'CONG_KHAI' } },
      draft: { title: 'Chuyển về nháp', message: `“${d.ten}” sẽ rời thư viện; bản sao người học đã lưu giữ nguyên.`, confirmLabel: 'Chuyển về nháp', reason: true, method: 'PATCH', body: { quyenTruyCap: 'RIENG_TU' } },
      hide: { title: 'Ẩn khỏi thư viện', message: `“${d.ten}” bị gỡ khỏi thư viện do kiểm duyệt.`, confirmLabel: 'Ẩn bộ', tone: 'danger', reason: true, method: 'PATCH', body: { trangThaiKiemDuyet: 'DA_AN' } },
      show: { title: 'Hiện lại bộ mẫu', message: `“${d.ten}” được hiện lại theo trạng thái xuất bản.`, confirmLabel: 'Hiện lại', reason: true, method: 'PATCH', body: { trangThaiKiemDuyet: 'BINH_THUONG' } },
      remove: { title: 'Xóa bộ mẫu', message: `Xóa “${d.ten}” và toàn bộ thẻ mẫu. Không hoàn tác được.`, confirmLabel: 'Xóa bộ', tone: 'danger', reason: true, method: 'DELETE', body: {} },
    }[act];
    const answer = await confirm(spec);
    if (!answer) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/admin/decks/${d.id}`, { method: spec.method, body: JSON.stringify({ ...spec.body, ...(spec.reason ? { lyDo: answer.lyDo } : {}), version: d.version }) });
      toast(`${spec.confirmLabel}: ${d.ten}.`, { variant: 'success' });
      refresh();
      if (act === 'remove' && id) router.push('/quan-tri/bo-mau');
    } catch (err) {
      toast(err.message, { variant: 'error' });
      if (err.status === 409) refresh();
    } finally {
      setBusy(false);
    }
  }

  async function deleteCard(c) {
    const ok = await confirm({ title: 'Xóa thẻ mẫu', message: `Xóa thẻ “${c.tu}” khỏi bộ?`, confirmLabel: 'Xóa thẻ', tone: 'danger' });
    if (!ok) return;
    setBusy(true);
    try {
      await apiFetch(`/api/v1/admin/cards/${c.id}?version=${c.version}`, { method: 'DELETE' });
      toast(`Đã xóa thẻ ${c.tu}.`, { variant: 'success' });
    } catch (err) {
      toast(err.message, { variant: 'error' });
    } finally {
      setBusy(false);
      refresh();
    }
  }

  if (!me?.vaiTro?.includes('ADMIN')) return <div className="adm-empty">Không có quyền truy cập</div>;

  const deckTools = (d, inList) => (
    <div className="adm-row-actions" style={inList ? undefined : { justifyContent: 'flex-start' }}>
      {inList && <Link className="adm-btn adm-btn-sm" href={`/quan-tri/bo-mau?id=${d.id}`}>Thẻ ({d.soThe})</Link>}
      <button type="button" className="adm-btn adm-btn-sm" onClick={() => { setEditingDeck(d); setShowDeckDialog(true); }}><Icon name="edit" />Sửa</button>
      {d.trangThaiKiemDuyet !== 'DA_AN' && (
        <button type="button" className={`adm-btn adm-btn-sm ${d.quyenTruyCap === 'CONG_KHAI' ? '' : 'adm-btn-primary'}`} disabled={busy} onClick={() => deckAction(d.quyenTruyCap === 'CONG_KHAI' ? 'draft' : 'publish', d)}>
          {d.quyenTruyCap === 'CONG_KHAI' ? 'Về nháp' : 'Xuất bản'}
        </button>
      )}
      <button type="button" className="adm-btn adm-btn-sm" disabled={busy} onClick={() => deckAction(d.trangThaiKiemDuyet === 'DA_AN' ? 'show' : 'hide', d)}>{d.trangThaiKiemDuyet === 'DA_AN' ? 'Hiện lại' : 'Ẩn'}</button>
      <button type="button" className="adm-btn adm-btn-sm" disabled={busy} onClick={() => deckAction('remove', d)} aria-label={`Xóa ${d.ten}`}><Icon name="trash" /></button>
    </div>
  );

  const deckDialog = showDeckDialog && (
    <DeckDialog deck={editingDeck} topics={topics} onClose={() => { setShowDeckDialog(false); setEditingDeck(null); }} onSave={saved => { const created = !editingDeck; setShowDeckDialog(false); setEditingDeck(null); refresh(); if (created && saved?.id) router.push(`/quan-tri/bo-mau?id=${saved.id}`); }} />
  );

  if (id) {
    const d = deck.data;
    const cardColumns = [
      { key: 'word', header: 'Từ', sortValue: c => c.tu, render: c => <span><b style={{ fontWeight: 600, fontFamily: 'var(--font-word)', fontSize: 15 }}>{c.tu}</b>{c.phienAm && <span className="adm-muted"> {c.phienAm}</span>}{c.tuLoai && <><br /><span className="adm-muted">{c.tuLoai}</span></>}</span> },
      { key: 'meaning', header: 'Nghĩa', sortValue: c => c.nghiaVi, render: c => c.nghiaVi },
      { key: 'example', header: 'Ví dụ', render: c => (c.viDuEn ? <span style={{ display: 'block', maxWidth: 380 }}>{c.viDuEn}{c.dichVi && <><br /><span className="adm-muted">{c.dichVi}</span></>}</span> : <span className="adm-muted">—</span>) },
      { key: 'actions', header: 'Thao tác', srHeader: true, render: c => (
        <div className="adm-row-actions">
          <button type="button" className="adm-btn adm-btn-sm" onClick={() => setEditingCard(c)}><Icon name="edit" />Sửa</button>
          <button type="button" className="adm-btn adm-btn-sm" disabled={busy} onClick={() => deleteCard(c)} aria-label={`Xóa thẻ ${c.tu}`}><Icon name="trash" /></button>
        </div>
      ) },
    ];
    return (
      <div className="adm-page">
        <div><Link href="/quan-tri/bo-mau" className="adm-btn adm-btn-sm"><Icon name="arrow-left" />Tất cả bộ mẫu</Link></div>
        {deck.isLoading ? <div className="adm-card adm-empty" role="status">Đang tải bộ mẫu…</div> : deck.isError ? (
          <div className="adm-card"><ErrorState title="Chưa tải được bộ mẫu" description={deck.error?.message} onRetry={() => deck.refetch()} /></div>
        ) : d && (
          <>
            <AdminPageHead title={d.ten} description={d.moTa} actions={deckTools(d, false)} />
            <div className="adm-card adm-card-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px', alignItems: 'center', fontSize: 13 }}>
              <Pill tone={deckState(d)[1]}>{deckState(d)[0]}</Pill>
              <span><span className="adm-muted">Mục tiêu</span> {GOAL[d.mucTieu] || '—'}</span>
              <span><span className="adm-muted">Chủ đề</span> {d.chuDeTen || 'Chưa có'}</span>
              <span><span className="adm-muted">Trình độ</span> {LEVEL[d.trinhDo] || d.trinhDo}</span>
              <span><span className="adm-muted">Thẻ</span> {d.soThe}</span>
              <span><span className="adm-muted">Bản sao</span> {d.soBanSao}</span>
              <span><span className="adm-muted">Sửa lúc</span> {new Date(d.updatedAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
              <Link className="adm-a" style={{ marginLeft: 'auto' }} href={`/quan-tri/nhat-ky?loai=BO_THE&q=${encodeURIComponent(d.ten)}`}>Nhật ký bộ này</Link>
            </div>
          </>
        )}
        <section className="adm-card">
          <AdminTable
            caption="Thẻ của bộ mẫu"
            columns={cardColumns}
            rows={cards.data || []}
            loading={cards.isLoading}
            error={cards.error}
            onRetry={cards.refetch}
            onRowClick={c => setEditingCard(c)}
            rowLabel={c => `Sửa thẻ ${c.tu}`}
            toolbar={<><b style={{ fontSize: 14 }}>Thẻ mẫu</b><span className="adm-muted">{cards.data ? `${cards.data.length} thẻ` : ''}</span><button type="button" className="adm-btn adm-btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setEditingCard({})}><Icon name="plus" />Thêm thẻ</button></>}
            emptyTitle="Bộ chưa có thẻ"
            emptyText="Thêm ít nhất một thẻ để xuất bản bộ."
            exportCsv={{ filename: `the-mau-${id}.csv`, columns: [
              { header: 'Từ', csv: c => c.tu }, { header: 'Phiên âm', csv: c => c.phienAm }, { header: 'Từ loại', csv: c => c.tuLoai },
              { header: 'Nghĩa', csv: c => c.nghiaVi }, { header: 'Ví dụ', csv: c => c.viDuEn }, { header: 'Dịch ví dụ', csv: c => c.dichVi },
            ] }}
          />
        </section>
        {editingCard !== null && (
          <CardDialog card={Object.keys(editingCard).length === 0 ? null : editingCard} deckId={id} onClose={() => setEditingCard(null)} onSave={() => { setEditingCard(null); refresh(); }} />
        )}
        {deckDialog}
        {dialog}
      </div>
    );
  }

  const columns = [
    { key: 'name', header: 'Bộ mẫu', sortValue: d => d.ten, render: d => <span style={{ display: 'block', maxWidth: 420 }}><Link className="adm-a" href={`/quan-tri/bo-mau?id=${d.id}`}>{d.ten}</Link>{d.moTa && <span className="adm-muted" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.moTa}</span>}</span> },
    { key: 'state', header: 'Trạng thái', sortValue: d => deckState(d)[0], render: d => <Pill tone={deckState(d)[1]}>{deckState(d)[0]}</Pill> },
    { key: 'meta', header: 'Mục tiêu · Chủ đề', sortValue: d => d.chuDeTen, render: d => <span><span>{GOAL[d.mucTieu] || '—'}</span><br /><span className="adm-muted">{d.chuDeTen || 'Chưa có chủ đề'} · {LEVEL[d.trinhDo] || d.trinhDo}</span></span> },
    { key: 'cards', header: 'Thẻ', align: 'right', sortValue: d => d.soThe, render: d => d.soThe },
    { key: 'copies', header: 'Bản sao', align: 'right', sortValue: d => d.soBanSao, render: d => d.soBanSao },
    { key: 'updated', header: 'Sửa lúc', nowrap: true, sortValue: d => Date.parse(d.updatedAt), render: d => new Date(d.updatedAt).toLocaleDateString('vi-VN') },
    { key: 'actions', header: 'Thao tác', srHeader: true, render: d => deckTools(d, true) },
  ];
  const data = list.data;

  return (
    <div className="adm-page">
      <AdminPageHead
        title="Bộ mẫu & thẻ"
        meta={data ? data.totalElements : null}
        description="Nội dung của nhóm biên soạn, hiện trong thư viện khi đã xuất bản. Bộ mới luôn là nháp; chuyển nháp, ẩn, hiện lại và xóa cần lý do."
        actions={<>
          <Link className="adm-btn" href="/quan-tri/nhat-ky?loai=BO_THE"><Icon name="clock" />Nhật ký</Link>
          <button type="button" className="adm-btn adm-btn-primary" onClick={() => { setEditingDeck(null); setShowDeckDialog(true); }}><Icon name="plus" />Tạo bộ mẫu</button>
        </>}
      />
      <section className="adm-card">
        <AdminTable
          caption="Danh sách bộ mẫu"
          columns={columns}
          rows={data?.items || []}
          loading={list.isLoading}
          error={list.error}
          onRetry={list.refetch}
          onRowClick={d => router.push(`/quan-tri/bo-mau?id=${d.id}`)}
          rowLabel={d => `Mở ${d.ten}`}
          toolbar={<>
            <div className="adm-seg" role="tablist" aria-label="Trạng thái bộ">
              {DECK_TABS.map(([value, label]) => <button key={value || 'all'} type="button" role="tab" aria-selected={trangThai === value} onClick={() => go({ trangThai: value })}>{label}</button>)}
            </div>
            <form role="search" onSubmit={event => { event.preventDefault(); go({ q: search.trim() }); }} style={{ display: 'contents' }}>
              <label className="sr-only" htmlFor="deck-q">Tìm theo tên bộ</label>
              <input id="deck-q" className="adm-input" type="search" placeholder="Tìm theo tên bộ, Enter" value={search} onChange={event => setSearch(event.target.value)} />
            </form>
          </>}
          emptyTitle="Chưa có bộ mẫu phù hợp"
          emptyText="Tạo bộ ở trạng thái nháp, thêm thẻ rồi xuất bản."
          pagination={data ? { page, size: PAGE_SIZE, totalElements: data.totalElements, totalPages: data.totalPages, onPageChange: value => go({ page: value || null }) } : null}
        />
      </section>
      {deckDialog}
      {dialog}
    </div>
  );
}

export default function AdminDecksPage() {
  return (
    <Suspense fallback={<div className="adm-empty" role="status">Đang tải…</div>}>
      <AdminDecksContent />
    </Suspense>
  );
}
