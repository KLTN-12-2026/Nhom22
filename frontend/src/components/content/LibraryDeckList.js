'use client';
import Link from 'next/link';
import { useMe } from '@/hooks/useMe';
import { DeckCover } from '@/components/ui/DeckCover';
import { Highlight } from '@/components/ui/Highlight';
import { CopyBadge } from '@/components/content/CopyBadge';

const LEVEL_LABEL = { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' };
const LEVEL_RANK = { MOI_BAT_DAU: 1, CO_BAN: 2, TRUNG_CAP: 3, NANG_CAO: 4 };
const GOAL_LABEL = { GIAO_TIEP: 'Giao tiếp', TOEIC: 'TOEIC' };

export function LibraryDeckList({ decks = [], offset = 0, query = '', showAuthor = true }) {
  const { data: me } = useMe();
  return (
    <>
      <div className="deck-head" aria-hidden="true">
        <span>Số</span>
        <span>Bộ thẻ</span>
        <span>Mục tiêu</span>
        <span>Trình độ</span>
        <span style={{ textAlign: 'right' }}>Số thẻ</span>
      </div>
      <ol className="answer-list" role="list">
        {decks.map((deck, i) => (
          <li key={deck.id} data-tour-deck={deck.id} data-tour-copied={(me && deck.chuSoHuuId === me.id) || undefined} className={`answer-row deck-row${me && deck.chuSoHuuId === me.id ? ' is-mine' : ''}`}>
            <span className="answer-no">{offset + i + 1}</span>
            <div className="answer-main">
              <div className="deck-name-line">
                <DeckCover deck={deck} priority={i < 2} />
                <Link className="answer-title" data-tour="deck-title" href={`/thu-vien/${deck.id}`}><Highlight text={deck.ten} query={query} /></Link>
              </div>
              {deck.moTa && <p className="muted clamp-2"><Highlight text={deck.moTa} query={query} /></p>}
              <div className="answer-meta">
                {deck.nguon === 'MAU'
                  ? <span className="stamp stamp-solid">Bộ mẫu</span>
                  : <span className="stamp stamp-graphite">Người học chia sẻ</span>}
                {me && deck.chuSoHuuId === me.id && <Link className="stamp stamp-accent" href={`/bo-the/${deck.id}`}>Bộ của bạn</Link>}
                {deck.banSao && <CopyBadge banSao={deck.banSao} compact />}
                <span>{deck.tenChuDe || 'Chưa phân chủ đề'}</span>
                {showAuthor && deck.chuSoHuuId && (
                  <Link href={`/tac-gia/${deck.chuSoHuuId}`}>{deck.tenTacGia || 'Tác giả'}</Link>
                )}
                <span className="muted">Cập nhật {new Date(deck.updatedAt).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
            <div className="deck-cols">
              <span className="deck-goal">{GOAL_LABEL[deck.mucTieu] || 'Chưa đặt mục tiêu'}</span>
              <span className="deck-level">
                <span className="level" title="Trình độ tự đánh giá">
                  <span className="bubble-row" aria-hidden="true">
                    {[1, 2, 3, 4].map(n => <span key={n} className={`bubble${LEVEL_RANK[deck.trinhDo] >= n ? ' is-filled' : ''}`}></span>)}
                  </span>
                  {LEVEL_LABEL[deck.trinhDo]}
                </span>
              </span>
              <span className="deck-size"><span className="col-count">{deck.soThe} thẻ</span></span>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
