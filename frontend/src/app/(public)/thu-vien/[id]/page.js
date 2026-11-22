'use client';
import { Suspense, use, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { libraryPage } from '@/lib/library-query.mjs';
import { clearDeckCopyKey, copyDeck, deckCopyKey } from '@/lib/deck-copy.mjs';
import { useMe } from '@/hooks/useMe';
import { ErrorState, Icon, Pagination, useToast } from '@/components/ui';
import { CardEntry } from '@/components/content/CardEntry';
import { AuthorTag } from '@/components/content/AuthorTag';
import { CardImagePreference } from '@/components/content/CardImagePreference';
import { ContentReportButton } from '@/components/content/ContentReportButton';
import { useCardImages } from '@/hooks/useCardImages';
import { useFocusCard } from '@/hooks/useFocusCard';
import { CopyBadge } from '@/components/content/CopyBadge';
import styles from './page.module.css';

const LEVEL = { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' };
const LEVEL_VALUE = { MOI_BAT_DAU: 1, CO_BAN: 2, TRUNG_CAP: 3, NANG_CAO: 4 };
const GOAL = { GIAO_TIEP: 'Giao tiếp', TOEIC: 'TOEIC' };

export default function LibraryDetailPage({ params }) {
  const { id } = use(params);
  return <Suspense fallback={<p className="page" role="status">Đang tải bộ thẻ…</p>}><LibraryDetail key={id} id={id} /></Suspense>;
}

function LibraryDetail({ id }) {
  const router = useRouter();
  const client = useQueryClient();
  const { toast } = useToast();
  const [showImages, setShowImages] = useCardImages();
  const search = useSearchParams();
  const requestedPage = libraryPage(search.get('page'));
  const focusId = /^[1-9][0-9]{0,18}$/.test(search.get('the') || '') ? search.get('the') : null;
  const attempt = useRef(null);
  const busy = useRef(false);
  const { data: me, isLoading: loadingUser, error: userError } = useMe();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library-deck', id, requestedPage, focusId],
    queryFn: () => apiFetch(`/api/v1/library/decks/${encodeURIComponent(id)}?page=${requestedPage}&size=20${focusId ? `&theId=${focusId}` : ''}`),
  });
  const deckName = data?.boThe?.ten;
  useEffect(() => {
    if (!deckName) return;
    const previousTitle = document.title;
    document.title = `${deckName} — VocabLearning`;
    return () => { document.title = previousTitle; };
  }, [deckName]);

  const page = data?.the?.page ?? requestedPage;
  useFocusCard(focusId, Boolean(data));
  const copy = useMutation({
    mutationFn: key => copyDeck(apiFetch, id, key), retry: false,
    onSuccess: response => {
      client.invalidateQueries({ queryKey: ['my-decks'] });
      client.setQueryData(['deck', response.id], response);
      toast('Đã sao chép bộ thẻ', { variant: 'success' });
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
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/thu-vien/${encodeURIComponent(id)}`);
      toast('Đã sao chép liên kết', { variant: 'success' });
    } catch { toast('Không sao chép được. Hãy sao chép địa chỉ trên thanh trình duyệt.', { variant: 'error' }); }
  };
  if (isLoading) return <div className="page"><div className="sheet"><div className="skeleton" role="status" aria-label="Đang tải bộ thẻ"><div className="sk sk-title" /><div className="sk sk-line" /><div className={`sk sk-line ${styles.shortLine}`} /><div className="sk sk-row" /><div className="sk sk-row" /></div></div></div>;
  if (error) return <div className="page sheet"><ErrorState title={error.status === 404 ? 'Bộ thẻ không còn công khai' : 'Không tải được bộ thẻ'} description={error.message} onRetry={refetch} /><Link href="/thu-vien" className="btn btn-secondary">Về thư viện</Link></div>;
  const { boThe, the } = data;
  if (boThe.soThe === 0 && the.items.length === 0) return <div className="page sheet"><div className="empty">
    <h1 className={styles.listTitle}>Bộ thẻ này chưa có thẻ nào</h1>
    <p>Người soạn chưa thêm nội dung. Hãy chọn bộ khác trong thư viện.</p>
    <Link href="/thu-vien" className="btn btn-secondary">Về thư viện</Link>
  </div></div>;

  const existingCopyId = copy.error?.status === 409 ? copy.error.data?.details?.boTheId : null;
  const originId = boThe.banSao?.boGocId || (copy.error?.data?.details?.lyDo === 'LA_BAN_SAO' ? copy.error.data.details.boGocId : null);
  return <div className="page page-grid with-side">
    <article className="sheet" aria-labelledby="deck-title">
      <Link href="/thu-vien" className={`btn btn-quiet ${styles.backLink}`}><Icon name="arrow-left" />Thư viện</Link>
      <div className="form-head">
        <div className="answer-meta"><span className={`stamp ${boThe.nguon === 'MAU' ? 'stamp-solid' : 'stamp-graphite'}`}>{boThe.nguon === 'MAU' ? 'Bộ mẫu' : 'Người học chia sẻ'}</span>{boThe.mucTieu && <span className="stamp">{GOAL[boThe.mucTieu] || boThe.mucTieu}</span>}<span className="stamp stamp-quiet"><Icon name="globe" />Công khai</span><CopyBadge banSao={boThe.banSao} /></div>
        <h1 id="deck-title" className={styles.title}>{boThe.ten}</h1>
        <AuthorTag id={boThe.chuSoHuuId} name={boThe.tenTacGia} prefix={boThe.banSao ? 'Người sao chép' : 'Tác giả'} />
        {boThe.moTa && <p>{boThe.moTa}</p>}
        <div className={styles.actions}>
          {boThe.banSao
            ? (boThe.banSao.boGocXemDuoc && <Link className="btn btn-primary btn-lg" href={`/thu-vien/${boThe.banSao.boGocId}`}><Icon name="arrow-left" />Xem bộ gốc</Link>)
            : <button type="button" className="btn btn-primary btn-lg" disabled={loadingUser || copy.isPending || copy.isSuccess || !!existingCopyId || (!!userError && userError.status !== 401)} aria-busy={copy.isPending} onClick={handleCopy}>{copy.isSuccess ? 'Đã sao chép' : copy.isPending ? 'Đang sao chép…' : 'Sao chép để học'}</button>}
          <button type="button" className="btn btn-quiet btn-lg" onClick={copyLink}><Icon name="link" />Sao chép liên kết</button>
          <ContentReportButton key={boThe.id} deck={boThe} />
        </div>
        {copy.isSuccess && <div className="notice notice-success" role="status"><Icon name="check" /><div className="stack-sm"><p className="notice-title">Đã sao chép bộ thẻ vào Bộ của tôi</p><Link className={`btn btn-secondary btn-sm ${styles.successLink}`} href={`/bo-the/${copy.data.id}`}>Mở bộ vừa sao chép</Link></div></div>}
        {boThe.banSao && <p className="muted small">Bộ này là bản sao nên không sao chép tiếp được. Hãy sao chép từ bộ gốc.</p>}
        {existingCopyId && <div className="notice notice-warning" role="status"><Icon name="info" /><div className="stack-sm"><p className="notice-title">Bạn đã có bản sao của bộ này</p><p className="small">Mỗi bộ chỉ sao chép được một lần. Xóa bản sao cũ nếu muốn sao chép lại.</p><Link className={`btn btn-secondary btn-sm ${styles.successLink}`} href={`/bo-the/${existingCopyId}`}>Mở bản sao của bạn</Link></div></div>}
        {!boThe.banSao && originId && <div className="notice notice-warning" role="status"><Icon name="info" /><div className="stack-sm"><p className="notice-title">Bộ này là bản sao</p><Link className={`btn btn-secondary btn-sm ${styles.successLink}`} href={`/thu-vien/${originId}`}>Xem bộ gốc</Link></div></div>}
        {copy.error && !existingCopyId && !originId && <ErrorState title="Không sao chép được bộ thẻ" description={copy.error.message} onRetry={handleCopy} />}
        {userError && userError.status !== 401 && <ErrorState title="Không kiểm tra được đăng nhập" description={userError.message} onRetry={() => client.invalidateQueries({ queryKey: ['me'] })} />}
      </div>
      <div className={`library-card-toolbar ${styles.cardToolbar}`}><div className="library-card-summary"><h2 id="cards-title" className={styles.listTitle}>Thẻ mẫu</h2><p className="muted small" id="sample-note">Hiển thị {the.items.length}/{boThe.soThe} thẻ</p></div><CardImagePreference checked={showImages} onChange={setShowImages} /></div>
      {the.items.length === 0 ? <div className="empty"><h2>Bộ thẻ này chưa có thẻ ở trang này</h2><p>Chọn trang trước hoặc quay lại thư viện.</p><button type="button" className="btn btn-secondary" onClick={() => router.replace(`/thu-vien/${encodeURIComponent(id)}`, { scroll: false })}>Về trang đầu</button></div> : <ol className="answer-list" id="cards" role="list" aria-labelledby="cards-title" aria-describedby="sample-note">
        {the.items.map((card, index) => <CardEntry
          key={card.id}
          card={card}
          number={page * 20 + index + 1}
          deckId={id}
          publicDeck
          showImages={showImages}
          focused={card.id === focusId}
        />)}
      </ol>}
      <Pagination className={styles.pager} page={page + 1} totalPages={the.totalPages} onPageChange={value => router.replace(`/thu-vien/${encodeURIComponent(id)}?page=${value - 1}`, { scroll: false })} />
    </article>
    <aside className="side-col">
      <section className="panel" aria-labelledby="info-title">
        <h2 id="info-title" className="panel-title">Thông tin bộ thẻ</h2>
        <dl className={`kv ${styles.metadata}`}>
          <dt>Chủ đề</dt><dd>{boThe.tenChuDe || 'Chưa phân loại'}</dd>
          <dt>Trình độ</dt><dd>{LEVEL[boThe.trinhDo] ? <span className={`level ${styles.level}`} title="Trình độ tự đánh giá">
            <span className="bubble-row" aria-hidden="true">{[1, 2, 3, 4].map(value => <span key={value} className={`bubble${value <= LEVEL_VALUE[boThe.trinhDo] ? ' is-filled' : ''}`} />)}</span>
            {LEVEL[boThe.trinhDo]}
          </span> : 'Chưa chọn'}</dd>
          <dt>Số thẻ</dt><dd>{boThe.soThe}</dd>
          <dt>Người soạn</dt><dd>{boThe.chuSoHuuId ? <Link href={`/tac-gia/${boThe.chuSoHuuId}`}>{boThe.tenTacGia || 'Người học'}</Link> : boThe.tenTacGia || (boThe.nguon === 'MAU' ? 'Nhóm biên soạn VocabLearning' : 'Người học')}</dd>
          <dt>Nguồn</dt><dd>{boThe.nguon === 'MAU' ? 'Bộ mẫu' : 'Người học chia sẻ'}</dd>
          <dt>Cập nhật</dt><dd>{new Date(boThe.updatedAt).toLocaleDateString('vi-VN')}</dd>
        </dl>
      </section>
      <section className="panel" aria-labelledby="copy-title"><h2 id="copy-title" className="panel-title">Khi bạn sao chép</h2><ul className={styles.facts}>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Bản sao là bộ riêng tư của bạn, sửa, thêm, xóa thẻ thoải mái.</span></li>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Tiến độ học bắt đầu từ đầu. Không mang theo lịch sử hay điểm của người soạn.</span></li>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Bộ gốc cập nhật sau này không ghi đè bản sao của bạn.</span></li>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Mỗi bộ chỉ sao chép được một lần. Bản sao không sao chép tiếp được.</span></li>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Muốn công khai bản sao, bạn gửi yêu cầu để tác giả bộ gốc (bộ mẫu: quản trị viên) duyệt.</span></li>
      </ul></section>
    </aside>
  </div>;
}
