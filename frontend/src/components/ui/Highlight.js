import { highlightParts } from '@/lib/search-text.mjs';

export function Highlight({ text, query }) {
  return highlightParts(text || '', query || '').map((part, index) => (
    part.match ? <mark key={index} className="search-mark">{part.text}</mark> : <span key={index}>{part.text}</span>
  ));
}
