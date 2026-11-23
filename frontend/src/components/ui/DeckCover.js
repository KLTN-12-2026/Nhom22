import { deckCover } from '@/lib/deck-illustration.mjs';

export function DeckCover({ deck, topicName }) {
  const cover = deckCover(deck, topicName ?? deck.tenChuDe);
  return (
    <span className="deck-thumbnail deck-cover" data-tone={cover.tone} aria-hidden="true">
      <span className="deck-cover-code">{cover.code}</span>
      <span className="deck-cover-word" lang={cover.sample ? 'en' : undefined}>{cover.word}</span>
    </span>
  );
}
