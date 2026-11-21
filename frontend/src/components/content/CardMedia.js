'use client';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Icon } from '@/components/ui';
import styles from './CardMedia.module.css';

export function CardMedia({ deckId, cardId, role, publicDeck = false, autoShow = false, compact = false }) {
  if (compact && role !== 'ANH') return <CompactAudio deckId={deckId} cardId={cardId} role={role} publicDeck={publicDeck} />;
  return <FullMedia deckId={deckId} cardId={cardId} role={role} publicDeck={publicDeck} autoShow={autoShow} />;
}

function CompactAudio({ deckId, cardId, role, publicDeck }) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const audio = useRef(null);
  useEffect(() => () => audio.current?.pause(), []);
  const label = role === 'AM_TU' ? 'Nghe từ' : 'Nghe câu ví dụ';
  const play = async () => {
    if (playing) { audio.current?.pause(); setPlaying(false); return; }
    setError('');
    try {
      if (!audio.current) {
        const file = await apiFetch(`/api/v1/${publicDeck ? 'library/' : ''}decks/${encodeURIComponent(deckId)}/cards/${encodeURIComponent(cardId)}/files/${role}`);
        audio.current = new Audio(file.downloadUrl);
        audio.current.onended = () => setPlaying(false);
      }
      setPlaying(true);
      await audio.current.play();
    } catch (e) {
      audio.current = null;
      setPlaying(false);
      setError(e.message || 'Không phát được âm thanh');
    }
  };
  return <span className="speak-compact">
    <button type="button" className="btn btn-quiet btn-icon btn-sm" aria-pressed={playing} aria-label={label} title={label} onClick={play}><Icon name={playing ? 'pause' : 'volume'} /></button>
    {error && <span className="field-error" role="alert">{error}</span>}
  </span>;
}

function FullMedia({ deckId, cardId, role, publicDeck, autoShow }) {
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
  const label = role === 'ANH' ? 'Xem ảnh' : role === 'AM_TU' ? 'Đọc từ' : 'Đọc câu ví dụ';
  return <div ref={container} className={`${styles.media}${role === 'ANH' && (automatic || enabled) ? ` ${styles.imageMedia}` : ''}`}>
    {(!automatic || error) && <button type="button" className="btn btn-media btn-sm" disabled={isFetching} aria-busy={isFetching} onClick={() => enabled || automatic ? refetch() : setEnabled(true)}><Icon name={role === 'ANH' ? 'image' : 'volume'} />{isFetching ? 'Đang tải…' : error && automatic ? 'Tải lại ảnh' : label}</button>}
    {automatic && isFetching && !data && <p className="muted" role="status">Đang tải ảnh…</p>}
    {error && <p role="alert">{error.message}</p>}
    {data && (role !== 'ANH' || automatic || enabled) && (role === 'ANH' ? <Image unoptimized width={320} height={240} className={styles.image} src={data.downloadUrl} alt="Ảnh minh họa từ vựng" /> : <audio controls src={data.downloadUrl} aria-label={label} />)}
  </div>;
}
