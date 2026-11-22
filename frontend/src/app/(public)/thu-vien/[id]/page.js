'use client';
import { Suspense, use, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { libraryPage } from '@/lib/library-query.mjs';
import { clearDeckCopyKey, copyDeck, deckCopyKey } from '@/lib/deck-copy.mjs';
import { useMe } from '@/hooks/useMe';
import { ErrorState, Icon, Pagination } from '@/components/ui';
import { CardEntry } from '@/components/content/CardEntry';
import { AuthorTag } from '@/components/content/AuthorTag';
import { CardImagePreference } from '@/components/content/CardImagePreference';
import { useCardImages } from '@/hooks/useCardImages';
import { useFocusCard } from '@/hooks/useFocusCard';
import { CopyBadge } from '@/components/content/CopyBadge';
import { PlanTag, requestUpgrade } from '@/components/billing/PlanAccess';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import { ShareDialog } from '@/components/content/ShareDialog';
import { ReportDialog } from '@/components/content/ReportDialog';
import { SnapDialog } from '@/components/content/SnapDialog';
import { CardActions } from '@/components/content/CardActions';
import { cardShare, deckShare } from '@/lib/share.mjs';
import styles from './page.module.css';

const LEVEL = { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' };
const GOAL = { GIAO_TIEP: 'Giao tiếp', TOEIC: 'TOEIC' };

export default function LibraryDetailPage({ params }) {
  const { id } = use(params);
  return <Suspense fallback={<p className="page" role="status">Đang tải bộ thẻ…</p>}><LibraryDetail key={id} id={id} /></Suspense>;
}

function LibraryDetail({ id }) {
  const router = useRouter();
  const client = useQueryClient();
  const [showImages, setShowImages] = useCardImages();
  const search = useSearchParams();
  const requestedPage = libraryPage(search.get('page'));
  const focusId = /^[1-9][0-9]{0,18}$/.test(search.get('the') || '') ? search.get('the') : null;
  const [sharing, setSharing] = useState(null);
  const [reporting, setReporting] = useState(null);
  const [snapping, setSnapping] = useState(null);
  const attempt = useRef(null);
  const busy = useRef(false);
  const { data: me, isLoading: loadingUser, error: userError } = useMe();
  const planAccess = usePlanAccess(!!me);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library-deck', id, requestedPage, focusId],
    queryFn: () => apiFetch(`/api/v1/library/decks/${encodeURIComponent(id)}?page=${requestedPage}&size=20${focusId ? `&theId=${focusId}` : ''}`),
  });
  const page = data?.the?.page ?? requestedPage;
  useFocusCard(focusId, Boolean(data));
  const copy = useMutation({
    mutationFn: key => copyDeck(apiFetch, id, key), retry: false,
    onSuccess: response => {
      client.invalidateQueries({ queryKey: ['my-decks'] });
      client.setQueryData(['deck', response.id], response);
    },
  });
  const handleCopy = async () => {
    if (busy.current || copy.isSuccess) return;
    if (!me) {
      if (userError && userError.status !== 401) return;
      router.push(`/dang-nhap?next=${encodeURIComponent(`/thu-vien/${id}`)}`);
      return;
    }
    busy.current = true;
    try {
      if (!attempt.current || attempt.current.userId !== me.id) {
        let key;
        try { key = deckCopyKey(window.sessionStorage, me.id, id); }
        catch { key = `copy-${crypto.randomUUID()}`; }
        attempt.current = { userId: me.id, key };
      }
      await copy.mutateAsync(attempt.current.key);
      try { clearDeckCopyKey(window.sessionStorage, me.id, id); } catch {}
      attempt.current = null;
    } catch (err) {
      if (err?.status === 409 || err?.status === 422) {
        try { clearDeckCopyKey(window.sessionStorage, me.id, id); } catch {}
        attempt.current = null;
      }
    } finally { busy.current = false; }
  };
  const openReport = target => {
    if (!me) {
      if (userError && userError.status !== 401) return;
      router.push(`/dang-nhap?next=${encodeURIComponent(`/thu-vien/${id}`)}`);
      return;
    }
    setReporting(target);
  };
  if (isLoading) return <div className="page sheet skeleton" role="status" aria-label="Đang tải bộ thẻ"><div className="sk sk-title" /><div className="sk sk-line" /><div className="sk sk-row" /></div>;
  if (error) return <div className="page sheet"><ErrorState title={error.status === 404 ? 'Bộ thẻ không còn công khai' : 'Không tải được bộ thẻ'} description={error.message} onRetry={refetch} /><Link href="/thu-vien" className="btn btn-secondary">Về thư viện</Link></div>;
  const { boThe, the } = data;
  const existingCopyId = copy.error?.status === 409 ? copy.error.data?.details?.boTheId : null;
  const premiumLocked = !!(boThe.caoCap && me && planAccess.of('BO_MAU_CAO_CAP')?.locked);
  const ownDeck = !!me && boThe.chuSoHuuId === me.id;
  const shareDeck = () => setSharing(deckShare(window.location.origin, id, boThe));
  const shareCard = card => setSharing(cardShare(window.location.origin, id, card));
  const originId = boThe.banSao?.boGocId || (copy.error?.data?.details?.lyDo === 'LA_BAN_SAO' ? copy.error.data.details.boGocId : null);
  return <div className="page page-grid with-side">
    <article className="sheet" aria-labelledby="deck-title">
      <Link href="/thu-vien" className="btn btn-quiet"><Icon name="arrow-left" />Thư viện</Link>
      <div className="form-head">
        <div className="answer-meta"><span className={`stamp ${boThe.nguon === 'MAU' ? 'stamp-solid' : 'stamp-graphite'}`}>{boThe.nguon === 'MAU' ? 'Bộ mẫu' : 'Người học chia sẻ'}</span>{boThe.mucTieu && <span className="stamp">{GOAL[boThe.mucTieu] || boThe.mucTieu}</span>}<span className="stamp stamp-quiet"><Icon name="globe" />Công khai</span>{ownDeck && <span className="stamp stamp-accent"><Icon name="user" />Bộ của bạn</span>}<CopyBadge banSao={boThe.banSao} /></div>
        <h1 id="deck-title" className={styles.title}>{boThe.ten}</h1>
        {boThe.caoCap && <p className="small"><PlanTag code="PREMIUM" locked={premiumLocked} label="Bộ mẫu cao cấp · Premium" />{premiumLocked ? ' Xem trước được, sao chép cần gói Premium.' : ''}</p>}
        <AuthorTag id={boThe.chuSoHuuId} name={boThe.tenTacGia} prefix={boThe.banSao ? 'Người sao chép' : 'Tác giả'} />
        {boThe.moTa && <p>{boThe.moTa}</p>}
        <div className={styles.actions}>
          {ownDeck
            ? <Link className="btn btn-primary btn-lg" href={`/bo-the/${id}`}><Icon name="edit" />Mở trong Bộ của tôi</Link>
            : boThe.banSao
            ? (boThe.banSao.boGocXemDuoc && <Link className="btn btn-primary btn-lg" href={`/thu-vien/${boThe.banSao.boGocId}`}><Icon name="arrow-left" />Xem bộ gốc</Link>)
            : premiumLocked
            ? <button type="button" className="btn btn-primary btn-lg" onClick={() => requestUpgrade('BO_MAU_CAO_CAP')}><Icon name="lock" />Sao chép (cần Premium)</button>
            : <button type="button" className="btn btn-primary btn-lg" disabled={loadingUser || copy.isPending || copy.isSuccess || !!existingCopyId || (!!userError && userError.status !== 401)} aria-busy={copy.isPending} onClick={handleCopy}>{copy.isSuccess ? 'Đã sao chép' : copy.isPending ? 'Đang sao chép…' : 'Sao chép để học'}</button>}
          <button type="button" className="btn btn-secondary btn-lg" onClick={shareDeck}><Icon name="share" />Chia sẻ</button>
          {!ownDeck && <button type="button" className="btn btn-quiet btn-lg" onClick={() => openReport({ loaiDoiTuong: 'BO_THE', doiTuongId: id, name: boThe.ten })}><Icon name="flag" />Báo cáo</button>}
        </div>
        {copy.isSuccess && <div className="notice notice-success" role="status"><Icon name="check" /><div className="stack-sm"><p className="notice-title">Đã sao chép bộ thẻ vào Bộ của tôi</p><Link className={`btn btn-secondary btn-sm ${styles.successLink}`} href={`/bo-the/${copy.data.id}`}>Mở bộ vừa sao chép</Link></div></div>}
        {ownDeck && <p className="muted small">Đây là bộ do bạn soạn nên không cần sao chép. Người khác sao chép bộ này sẽ gửi yêu cầu công khai cho bạn duyệt.</p>}
        {!ownDeck && boThe.banSao && <p className="muted small">Bộ này là bản sao nên không sao chép tiếp được. Hãy sao chép từ bộ gốc.</p>}
        {existingCopyId && <div className="notice notice-warning" role="status"><Icon name="info" /><div className="stack-sm"><p className="notice-title">Bạn đã có bản sao của bộ này</p><p className="small">Mỗi bộ chỉ sao chép được một lần. Xóa bản sao cũ nếu muốn sao chép lại.</p><Link className={`btn btn-secondary btn-sm ${styles.successLink}`} href={`/bo-the/${existingCopyId}`}>Mở bản sao của bạn</Link></div></div>}
        {!boThe.banSao && originId && <div className="notice notice-warning" role="status"><Icon name="info" /><div className="stack-sm"><p className="notice-title">Bộ này là bản sao</p><Link className={`btn btn-secondary btn-sm ${styles.successLink}`} href={`/thu-vien/${originId}`}>Xem bộ gốc</Link></div></div>}
        {copy.error && !existingCopyId && !originId && <ErrorState title="Không sao chép được bộ thẻ" description={copy.error.message} onRetry={handleCopy} />}
        {userError && userError.status !== 401 && <ErrorState title="Không kiểm tra được đăng nhập" description={userError.message} onRetry={() => client.invalidateQueries({ queryKey: ['me'] })} />}
      </div>
      <div className="library-card-toolbar"><div className="library-card-summary"><h2 className={styles.listTitle}>Thẻ mẫu</h2><p className="muted small">Hiển thị {the.items.length}/{boThe.soThe} thẻ</p></div><CardImagePreference checked={showImages} onChange={setShowImages} /></div>
      {the.items.length === 0 ? <div className="empty"><h2>Bộ thẻ này chưa có thẻ ở trang này</h2><p>Chọn trang trước hoặc quay lại thư viện.</p></div> : <ol className="answer-list">
        {the.items.map((card, index) => <CardEntry
          key={card.id}
          card={card}
          number={page * 20 + index + 1}
          deckId={id}
          publicDeck
          showImages={showImages}
          focused={card.id === focusId}
          tools={<CardActions word={card.tu} items={[
            { key: 'snap', icon: 'camera', label: 'Chụp thẻ', onClick: () => setSnapping({ card, number: page * 20 + index + 1 }) },
            { key: 'share', icon: 'share', label: 'Chia sẻ', onClick: () => shareCard(card) },
            !ownDeck && { key: 'report', icon: 'flag', label: 'Báo cáo', tone: 'danger', split: true, onClick: () => openReport({ loaiDoiTuong: 'THE_TU_VUNG', doiTuongId: card.id, name: card.tu }) },
          ]} />}
        />)}
      </ol>}
      {sharing && <ShareDialog onClose={() => setSharing(null)} {...sharing} />}
      {snapping && <SnapDialog key={snapping.card.id} onClose={() => setSnapping(null)} card={snapping.card} number={snapping.number} deckId={id} deckName={boThe.ten} publicDeck />}
      {reporting && <ReportDialog key={`${reporting.loaiDoiTuong}-${reporting.doiTuongId}`} onClose={() => setReporting(null)} {...reporting} />}
      <Pagination page={page + 1} totalPages={the.totalPages} onPageChange={value => router.replace(`/thu-vien/${encodeURIComponent(id)}?page=${value - 1}`, { scroll: false })} />
    </article>
    <aside className="side-col">
      <section className="panel" aria-labelledby="info-title"><h2 id="info-title" className="panel-title">Thông tin bộ thẻ</h2><dl className="kv"><dt>Chủ đề</dt><dd>{boThe.tenChuDe || 'Chưa chọn'}</dd><dt>Trình độ</dt><dd>{LEVEL[boThe.trinhDo]}</dd><dt>Số thẻ</dt><dd>{boThe.soThe}</dd><dt>Người soạn</dt><dd>{boThe.chuSoHuuId ? <Link href={`/tac-gia/${boThe.chuSoHuuId}`}>{boThe.tenTacGia}</Link> : boThe.tenTacGia}</dd><dt>Nguồn</dt><dd>{boThe.nguon === 'MAU' ? 'Bộ mẫu' : 'Người học chia sẻ'}</dd><dt>Cập nhật</dt><dd>{new Date(boThe.updatedAt).toLocaleDateString('vi-VN')}</dd></dl></section>
      <section className="panel" aria-labelledby="copy-title"><h2 id="copy-title" className="panel-title">Khi bạn sao chép</h2><ul className={styles.facts}>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Bản sao là bộ riêng tư của bạn, sửa, thêm, xóa thẻ thoải mái.</span></li>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Tiến độ học bắt đầu từ đầu. Không mang theo lịch sử hay điểm của người soạn.</span></li>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Bộ gốc cập nhật sau này không ghi đè bản sao của bạn.</span></li>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Mỗi bộ chỉ sao chép được một lần. Bản sao không sao chép tiếp được.</span></li>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Muốn công khai bản sao, bạn gửi yêu cầu để chính tác giả bộ gốc duyệt.</span></li>
      </ul></section>
    </aside>
  </div>;
}
