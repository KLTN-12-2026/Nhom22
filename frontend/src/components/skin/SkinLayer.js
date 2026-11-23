'use client';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { particleStyles, skinCode, skinFx } from '@/lib/skins.mjs';
import { SkinActors, SkinBackdrop } from './SkinActors';

const subscribe = listener => {
  window.addEventListener('vocab-skin-change', listener);
  return () => window.removeEventListener('vocab-skin-change', listener);
};
const snapshot = () => document.documentElement.dataset.skin || '';
const serverSnapshot = () => '';

const MOODS = { correct: 'happy', good: 'happy', easy: 'happy', wrong: 'sad', forget: 'sad', complete: 'party', streak: 'party', flip: 'flip' };

export function useSkin() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function SkinLayer() {
  const slug = useSkin();
  const layerRef = useRef(null);
  const code = skinCode(slug);
  const fx = skinFx(code);
  const particles = useMemo(() => particleStyles(fx.count || 0, slug.length), [fx.count, slug]);

  useEffect(() => {
    if (!slug) return;
    let timer = 0;
    const onFx = event => {
      const mood = MOODS[event.detail];
      const layer = layerRef.current;
      if (!mood || !layer) return;
      clearTimeout(timer);
      layer.dataset.mood = '';
      void layer.offsetWidth;
      layer.dataset.mood = mood;
      timer = setTimeout(() => { if (layer) layer.dataset.mood = ''; }, mood === 'party' ? 3200 : 1700);
    };
    window.addEventListener('vl-fx', onFx);
    return () => { window.removeEventListener('vl-fx', onFx); clearTimeout(timer); };
  }, [slug]);

  if (!slug) return null;

  return (
    <div ref={layerRef} className="skin-layer" data-for={slug} data-mood="" aria-hidden="true">
      <div className="skin-scene" />
      <SkinBackdrop slug={slug} />
      {fx.particles && (
        <div className="skin-particles" data-kind={fx.particles}>
          {particles.map((style, i) => <i key={i} style={style} />)}
        </div>
      )}
      <SkinActors slug={slug} />
    </div>
  );
}
