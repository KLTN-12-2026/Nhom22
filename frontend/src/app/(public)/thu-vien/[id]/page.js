'use client';
import { Suspense, use, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { libraryPage } from '@/lib/library-query.mjs';
import { copyDeck, deckCopyKey } from '@/lib/deck-copy.mjs';
import { useMe } from '@/hooks/useMe';
import { ErrorState, Icon, Pagination } from '@/components/ui';
import { CardMedia } from '@/components/content/CardMedia';
import { SpeakButton } from '@/components/content/SpeakButton';
import { CardImagePreference } from '@/components/content/CardImagePreference';
import { useCardImages } from '@/hooks/useCardImages';
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
  const page = libraryPage(search.get('page'));
  const [copyMessage, setCopyMessage] = useState('');
  const attempt = useRef(null);
  const busy = useRef(false);
  const { data: me, isLoading: loadingUser, error: userError } = useMe();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['library-deck', id, page],
    queryFn: () => apiFetch(`/api/v1/library/decks/${encodeURIComponent(id)}?page=${page}&size=20`),
  });
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
    } catch {
    } finally { busy.current = false; }
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/thu-vien/${encodeURIComponent(id)}`);
      setCopyMessage('Đã sao chép liên kết');
    } catch { setCopyMessage('Không sao chép được. Bạn có thể sao chép địa chỉ trên thanh trình duyệt.'); }
  };
  if (isLoading) return <div className="page sheet skeleton" role="status" aria-label="Đang tải bộ thẻ"><div className="sk sk-title" /><div className="sk sk-line" /><div className="sk sk-row" /></div>;
  if (error) return <div className="page sheet"><ErrorState title={error.status === 404 ? 'Bộ thẻ không còn công khai' : 'Không tải được bộ thẻ'} description={error.message} onRetry={refetch} /><Link href="/thu-vien" className="btn btn-secondary">Về thư viện</Link></div>;
  const { boThe, the } = data;
  return <div className="page page-grid with-side">
    <article className="sheet" aria-labelledby="deck-title">
      <Link href="/thu-vien" className="btn btn-quiet"><Icon name="arrow-left" />Thư viện</Link>
      <div className="form-head">
        <div className="answer-meta"><span className={`stamp ${boThe.nguon === 'MAU' ? 'stamp-solid' : 'stamp-graphite'}`}>{boThe.nguon === 'MAU' ? 'Bộ mẫu' : 'Người học chia sẻ'}</span>{boThe.mucTieu && <span className="stamp">{GOAL[boThe.mucTieu] || boThe.mucTieu}</span>}<span className="stamp stamp-quiet"><Icon name="globe" />Công khai</span></div>
        <h1 id="deck-title" className={styles.title}>{boThe.ten}</h1>
        {boThe.moTa && <p>{boThe.moTa}</p>}
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary btn-lg" disabled={loadingUser || copy.isPending || copy.isSuccess || (!!userError && userError.status !== 401)} aria-busy={copy.isPending} onClick={handleCopy}>{copy.isSuccess ? 'Đã sao chép' : copy.isPending ? 'Đang sao chép…' : 'Sao chép để học'}</button>
          <button type="button" className="btn btn-quiet btn-lg" onClick={copyLink}><Icon name="link" />Sao chép liên kết</button>
        </div>
        {copyMessage && <p role="status">{copyMessage}</p>}
        {copy.isSuccess && <div className="notice notice-success" role="status"><Icon name="check" /><div className="stack-sm"><p className="notice-title">Đã sao chép bộ thẻ vào Bộ của tôi</p><Link className={`btn btn-secondary btn-sm ${styles.successLink}`} href={`/bo-the/${copy.data.id}`}>Mở bộ vừa sao chép</Link></div></div>}
        {copy.error && <ErrorState title="Không sao chép được bộ thẻ" description={copy.error.message} onRetry={handleCopy} />}
        {userError && userError.status !== 401 && <ErrorState title="Không kiểm tra được đăng nhập" description={userError.message} onRetry={() => client.invalidateQueries({ queryKey: ['me'] })} />}
      </div>
      <div className="row-between"><h2 className={styles.listTitle}>Thẻ mẫu</h2><CardImagePreference checked={showImages} onChange={setShowImages} /><p className="muted small">Hiển thị {the.items.length}/{boThe.soThe} thẻ</p></div>
      {the.items.length === 0 ? <div className="empty"><h2>Bộ thẻ này chưa có thẻ ở trang này</h2><p>Chọn trang trước hoặc quay lại thư viện.</p></div> : <ol className="answer-list">
        {the.items.map((card, index) => <li key={card.id} className={`answer-row ${styles.card}`}>
          <span className="answer-no">{page * 20 + index + 1}</span>
          <div className="entry"><div className="entry-head"><span className="entry-word" lang="en">{card.tu}</span>{card.phienAm && <span className="entry-ipa" lang="en">{card.phienAm}</span>}{card.tuLoai && <span className="pos" lang="en">{card.tuLoai}</span>}</div>
            <p className="entry-mean">{card.nghiaVi}</p>{card.viDuEn && <p className="entry-example" lang="en">{card.viDuEn}</p>}{card.dichVi && <p className="muted small">{card.dichVi}</p>}{card.nguon && <p className="caption">Nguồn: {card.nguon}</p>}
            <div className={styles.media}>{card.anhId && <CardMedia key={`image-${card.id}-${showImages}`} autoShow={showImages} publicDeck deckId={id} cardId={card.id} role="ANH" />}{!card.amTuId && <SpeakButton text={card.tu} />}{!card.amCauId && card.viDuEn && <SpeakButton sentence text={card.viDuEn} />}{card.amTuId && <CardMedia publicDeck deckId={id} cardId={card.id} role="AM_TU" />}{card.amCauId && <CardMedia publicDeck deckId={id} cardId={card.id} role="AM_CAU" />}</div>
          </div>
        </li>)}
      </ol>}
      <Pagination page={page + 1} totalPages={the.totalPages} onPageChange={value => router.replace(`/thu-vien/${encodeURIComponent(id)}?page=${value - 1}`, { scroll: false })} />
    </article>
    <aside className="side-col">
      <section className="panel" aria-labelledby="info-title"><h2 id="info-title" className="panel-title">Thông tin bộ thẻ</h2><dl className="kv"><dt>Chủ đề</dt><dd>{boThe.tenChuDe || 'Chưa chọn'}</dd><dt>Trình độ</dt><dd>{LEVEL[boThe.trinhDo]}</dd><dt>Số thẻ</dt><dd>{boThe.soThe}</dd><dt>Người soạn</dt><dd>{boThe.tenTacGia}</dd><dt>Nguồn</dt><dd>{boThe.nguon === 'MAU' ? 'Bộ mẫu' : 'Người học chia sẻ'}</dd><dt>Cập nhật</dt><dd>{new Date(boThe.updatedAt).toLocaleDateString('vi-VN')}</dd></dl></section>
      <section className="panel" aria-labelledby="copy-title"><h2 id="copy-title" className="panel-title">Khi bạn sao chép</h2><ul className={styles.facts}>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Bản sao là bộ riêng tư của bạn, sửa, thêm, xóa thẻ thoải mái.</span></li>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Tiến độ học bắt đầu từ đầu. Không mang theo lịch sử hay điểm của người soạn.</span></li>
        <li><span className="bubble is-filled" aria-hidden="true" /><span>Bộ gốc cập nhật sau này không ghi đè bản sao của bạn.</span></li>
      </ul></section>
    </aside>
  </div>;
}
