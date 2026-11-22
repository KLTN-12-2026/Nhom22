'use client';
import { useEffect, useState } from 'react';
import { CARD_INTERVAL_MS, DEMO_CARDS } from '@/lib/demo-cards.mjs';
import { useCardCycle } from '@/hooks/useCardCycle';

const LETTERS = ['A', 'B', 'C', 'D'];

function Face({ card, number }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 1600);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="aside-face">
      <div className="aside-q"><span className="aside-no">Câu {number}</span><span className="aside-dir">{card.dir}</span></div>
      <p className={`aside-word${card.en ? '' : ' aside-word-vi'}`} lang={card.en ? 'en' : 'vi'}>{card.prompt}</p>
      <p className="aside-ipa" lang={card.en ? 'en' : 'vi'}>{card.sub} {card.pos && <em>{card.pos}</em>}</p>
      <ol className="aside-options" role="list">
        {card.options.map((option, i) => (
          <li key={option} lang={card.en ? 'vi' : 'en'} data-answer={revealed && i === card.answer ? 'true' : undefined}>
            <span className={`bubble${revealed && i === card.answer ? ' aside-pick is-filled' : ''}`}>{LETTERS[i]}</span>{option}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function AuthDemoCard() {
  const [paused, setPaused] = useState(false);
  const { index, tick, go } = useCardCycle(DEMO_CARDS.length, { interval: CARD_INTERVAL_MS, paused });
  const card = DEMO_CARDS[index];
  return (
    <figure className="aside-sheet" aria-label="Ví dụ câu hỏi từ vựng, tự đổi sau mỗi 10 giây"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="aside-stage">
        <div key={index} className="aside-flip"><Face card={card} number={14 + index} /></div>
      </div>
      <div className="aside-timer" aria-hidden="true"><span key={`${tick}-${paused}`} data-paused={paused || undefined} style={{ animationDuration: `${CARD_INTERVAL_MS}ms` }} /></div>
      <figcaption>
        <span>Mỗi từ có hai chiều học, mỗi chiều một lịch ôn riêng.</span>
        <span className="aside-dots">
          {DEMO_CARDS.map((item, i) => (
            <button key={item.prompt} type="button" aria-label={`Xem thẻ ${item.prompt}`} aria-current={i === index || undefined} onClick={() => go(i)} />
          ))}
        </span>
      </figcaption>
    </figure>
  );
}
