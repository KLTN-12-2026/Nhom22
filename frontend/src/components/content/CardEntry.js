'use client';
import { CardMedia } from '@/components/content/CardMedia';
import { SpeakButton } from '@/components/content/SpeakButton';
import styles from './CardEntry.module.css';

export function CardEntry({ card, number, deckId, publicDeck = false, showImages = false, focused = false, tagNames = [], tools = null }) {
  const media = { deckId, cardId: card.id, publicDeck };
  const level = Math.min(Math.max(Number(card.doKho) || 0, 0), 5);
  return (
    <li
      id={`card-${card.id}`}
      tabIndex={focused ? -1 : undefined}
      aria-current={focused ? 'true' : undefined}
      className={`answer-row ${styles.row}${card.anhId ? ` ${styles.hasImage}` : ''}${tools ? ` ${styles.hasTools}` : ''}${focused ? ' card-focus' : ''}`}
    >
      <span className="answer-no">{number}</span>

      <div className={styles.body}>
        <div className={styles.head}>
          <span className="entry-word" lang="en">{card.tu}</span>
          {card.amTuId ? <CardMedia {...media} role="AM_TU" compact /> : <SpeakButton text={card.tu} compact />}
          {card.phienAm && <span className="entry-ipa" lang="en">{card.phienAm}</span>}
          {card.tuLoai && <span className="pos" lang="en">{card.tuLoai}</span>}
        </div>
        <p className={styles.mean}>{card.nghiaVi}</p>

        {card.viDuEn && (
          <div className={styles.example}>
            <p className={styles.exampleEn} lang="en">
              <span>{card.viDuEn}</span>
              {card.amCauId ? <CardMedia {...media} role="AM_CAU" compact /> : <SpeakButton sentence text={card.viDuEn} compact />}
            </p>
            {card.dichVi && <p className={styles.exampleVi}>{card.dichVi}</p>}
          </div>
        )}

        <div className={styles.meta}>
          <span className={styles.level} title={`Độ khó ${level}/5`}>
            <span className="bubble-row" aria-hidden="true">
              {[1, 2, 3, 4, 5].map(n => <span key={n} className={`bubble${n <= level ? ' is-filled' : ''}`}></span>)}
            </span>
            Độ khó {level}/5
          </span>
          {tagNames.map(name => <span className="stamp stamp-quiet" key={name}>{name}</span>)}
          {card.trung && <span className="stamp stamp-warning">Có thể trùng</span>}
          {card.nguon && <span className={styles.source}>Nguồn: {card.nguon}</span>}
        </div>
      </div>

      {card.anhId && (
        <div className={styles.image}>
          <CardMedia key={`image-${card.id}-${showImages}`} {...media} role="ANH" autoShow={showImages} />
        </div>
      )}

      {tools && <div className={styles.tools}>{tools}</div>}
    </li>
  );
}
