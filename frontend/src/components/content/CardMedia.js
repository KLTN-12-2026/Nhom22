'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Icon } from '@/components/ui';
import styles from './CardMedia.module.css';

export function CardMedia({ deckId, cardId, role, publicDeck = false, autoShow = false }) {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const container = useRef(null);
  useEffect(() => {
    if (role !== 'ANH' || !autoShow) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '200px' });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [role, autoShow]);
  const automatic = role === 'ANH' && autoShow;
  const { data, isFetching, error, refetch } = useQuery({
    queryKey: ['card-media', publicDeck, deckId, cardId, role],
    queryFn: () => apiFetch(`/api/v1/${publicDeck ? 'library/' : ''}decks/${encodeURIComponent(deckId)}/cards/${encodeURIComponent(cardId)}/files/${role}`),
    enabled: enabled || (automatic && visible), staleTime: 0, gcTime: 0,
  });
  const label = role === 'ANH' ? 'Xem ảnh' : role === 'AM_TU' ? 'Nghe từ' : 'Nghe câu';
  return <div ref={container} className={`${styles.media}${role === 'ANH' && (automatic || enabled) ? ` ${styles.imageMedia}` : ''}`}>
    {(!automatic || error) && <button type="button" className="btn btn-media btn-sm" disabled={isFetching} aria-busy={isFetching} onClick={() => enabled || automatic ? refetch() : setEnabled(true)}><Icon name={role === 'ANH' ? 'image' : 'volume'} />{isFetching ? 'Đang tải…' : error && automatic ? 'Tải lại ảnh' : label}</button>}
    {automatic && isFetching && !data && <p className="muted" role="status">Đang tải ảnh…</p>}
    {error && <p role="alert">{error.message}</p>}
    {data && (role !== 'ANH' || automatic || enabled) && (role === 'ANH' ? <Image unoptimized width={320} height={240} className={styles.image} src={data.downloadUrl} alt="Ảnh minh họa từ vựng" /> : <audio controls src={data.downloadUrl} aria-label={label} />)}
  </div>;
}
