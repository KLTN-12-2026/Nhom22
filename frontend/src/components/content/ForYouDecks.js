'use client';
import Link from 'next/link';
import { useForYouDecks } from '@/hooks/useForYouDecks';
import styles from './ForYouDecks.module.css';

const LEVEL_LABEL = { MOI_BAT_DAU: 'Mới bắt đầu', CO_BAN: 'Cơ bản', TRUNG_CAP: 'Trung cấp', NANG_CAO: 'Nâng cao' };
const SETTINGS_HREF = '/ca-nhan/hoc-tap';

function NoTopics() {
  return (
    <div className={styles.empty}>
      <p>Chọn tối đa 5 chủ đề quan tâm để nhận gợi ý bộ thẻ phù hợp.</p>
      <Link className="btn btn-secondary btn-sm" href={SETTINGS_HREF}>Chọn chủ đề</Link>
    </div>
  );
}

function NoDecks() {
  return (
    <div className={styles.empty}>
      <p>Bạn đã xem hết bộ công khai thuộc chủ đề quan tâm. Thử thêm chủ đề khác.</p>
      <Link className="btn btn-quiet btn-sm" href={SETTINGS_HREF}>Đổi chủ đề</Link>
    </div>
  );
}

export function ForYouPanel({ enabled = true }) {
  const { data, isError } = useForYouDecks(5, { enabled });
  if (!enabled || isError || !data) return null;

  return (
    <section className="panel" aria-labelledby="for-you-title">
      <h2 className="panel-title" id="for-you-title">Dành cho bạn</h2>
      {!data.daChonChuDe ? <NoTopics /> : data.boThe.length === 0 ? <NoDecks /> : (
        <ul className={styles.compact} role="list">
          {data.boThe.map(deck => (
            <li key={deck.id}>
              <Link href={`/thu-vien/${deck.id}`}>{deck.ten}</Link>
              <span>{[deck.tenChuDe, LEVEL_LABEL[deck.trinhDo], `${deck.soThe} thẻ`].filter(Boolean).join(' · ')}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ForYouSection() {
  const { data, isError } = useForYouDecks(5);
  if (isError || !data) return null;

  return (
    <section className={`sheet ${styles.wide}`} aria-labelledby="for-you-dash-title">
      <div className={styles.head}>
        <h2 id="for-you-dash-title">Gợi ý theo chủ đề quan tâm</h2>
        {data.daChonChuDe && <p>Bộ công khai bạn chưa sao chép, chưa học; ưu tiên đúng trình độ.</p>}
      </div>
      {!data.daChonChuDe ? <NoTopics /> : data.boThe.length === 0 ? <NoDecks /> : (
        <ol className={`answer-list ${styles.list}`} role="list">
          {data.boThe.map((deck, i) => (
            <li key={deck.id} className="answer-row">
              <span className="answer-no">{i + 1}</span>
              <div className="answer-main">
                <Link className="answer-title clamp-2" href={`/thu-vien/${deck.id}`}>{deck.ten}</Link>
                <span className="answer-meta">
                  {deck.tenChuDe && <span>{deck.tenChuDe}</span>}
                  {deck.trinhDo && <span>{LEVEL_LABEL[deck.trinhDo]}</span>}
                  <span>{deck.soThe} thẻ</span>
                  {deck.tenTacGia && <span>{deck.tenTacGia}</span>}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
