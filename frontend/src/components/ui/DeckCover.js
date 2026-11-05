import Image from 'next/image';
import { deckIllustration } from '@/lib/deck-illustration.mjs';

// Illustrations describe the learning context; they are not user-uploaded covers.
export function DeckCover({ deck, priority = false }) {
  const illustration = deckIllustration(deck);
  if (!illustration) return null;
  const contextCover = ['office-cover.png', 'everyday-cover.png'].includes(illustration);
  return (
    <Image
      className={`deck-thumbnail${contextCover ? ' is-context-cover' : ''}`}
      src={`/images/${illustration}`}
      alt=""
      width={contextCover ? 96 : 64}
      height={contextCover ? 72 : 48}
      sizes={contextCover ? '(max-width: 639px) 80px, 96px' : '(max-width: 639px) 56px, 64px'}
      priority={priority}
    />
  );
}
