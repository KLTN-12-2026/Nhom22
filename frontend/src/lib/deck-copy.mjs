export function deckCopyKey(storage, userId, deckId, createId = () => crypto.randomUUID()) {
  const name = `deck-copy:${userId}:${deckId}`;
  const existing = storage.getItem(name);
  if (existing && /^[A-Za-z0-9._:-]{1,128}$/.test(existing)) return existing;
  const key = `copy-${createId()}`;
  storage.setItem(name, key);
  return key;
}

export function copyDeck(apiFetch, deckId, key) {
  return apiFetch(`/api/v1/decks/${encodeURIComponent(deckId)}/copy`, {
    method: 'POST',
    headers: { 'Idempotency-Key': key },
  });
}
