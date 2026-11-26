'use client';
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { particleStyles, skinCode, skinFx } from '@/lib/skins.mjs';
import { SkinActors, SkinBackdrop } from './SkinActors';
import { SantaDelivery } from './SantaDelivery';
import { TetEnvelope } from './TetEnvelope';

const subscribe = listener => {
  window.addEventListener('vocab-skin-change', listener);
  return () => window.removeEventListener('vocab-skin-change', listener);
};
const snapshot = () => document.documentElement.dataset.skin || '';
const serverSnapshot = () => '';

const MOODS = { correct: 'happy', good: 'happy', easy: 'happy', wrong: 'sad', forget: 'sad', complete: 'party', streak: 'party', flip: 'flip' };

const CLOUD_SHAPES = {
  natural: {
    body: 'M8 44C8 36 17 31 28 31C30 22 40 16 51 18C57 7 72 4 83 9C91 12 95 17 97 23C108 17 122 21 128 28C141 24 154 29 158 36C168 36 176 41 176 47C176 53 168 57 155 57H29C16 57 8 52 8 44Z',
    shade: 'M9 46C23 51 37 49 49 46C64 51 86 51 101 45C116 49 135 48 145 44C155 47 166 46 175 43C180 52 171 57 155 57H29C17 57 11 54 9 46Z',
    detail: 'M34 29C41 23 48 23 54 24C61 13 74 11 82 16M101 29C111 24 120 27 125 32',
  },
  eastern: {
    body: 'M5 47C19 45 29 41 33 36C36 30 45 27 55 29C56 20 65 14 76 15C85 6 101 8 108 20C118 18 127 24 130 31C141 27 151 34 152 39C159 42 168 41 175 34C174 46 161 52 149 52H25C17 52 9 51 5 47Z',
    shade: 'M5 47C20 49 32 46 43 42C53 46 65 46 77 42C90 47 107 45 117 41C128 46 142 46 153 42C161 44 169 41 175 34C174 46 161 52 149 52H25C17 52 9 51 5 47Z',
    detail: 'M32 42C50 43 62 35 60 31C58 27 49 31 51 36M81 37C97 37 106 31 101 25C97 20 88 23 89 29M122 40C137 42 145 39 145 35',
  },
  pixel: {
    body: 'M10 34H26V26H42V18H60V10H108V18H128V26H150V34H170V50H10Z',
    shade: 'M10 42H36V46H74V42H106V46H134V42H170V50H10Z',
    detail: 'M60 16H95M44 24H58M108 24H122',
  },
};

function SkinClouds({ slug, particles }) {
  const variant = slug === 'pixel' ? 'pixel' : slug === 'rong' ? 'eastern' : 'natural';
  const shape = CLOUD_SHAPES[variant];
  return (
    <div className="skin-clouds" data-cloud={variant} aria-hidden="true">
      {particles.map((style, index) => (
        <svg key={index} className="sk-cloud" viewBox="0 0 180 62" style={{ ...style, '--cloud-phase': (index + 1) / (particles.length + 1) }}>
          <path className="sk-cloud-body" d={shape.body} />
          <path className="sk-cloud-shade" d={shape.shade} />
          <path className="sk-cloud-detail" d={shape.detail} />
        </svg>
      ))}
    </div>
  );
}

export function useSkin() {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function SkinLayer() {
  const slug = useSkin();
  const layerRef = useRef(null);
  const code = skinCode(slug);
  const fx = skinFx(code);
  const particles = useMemo(() => particleStyles(fx.count || 0, slug.length), [fx.count, slug]);
  const hasClouds = fx.particles === 'cloud' || fx.particles === 'pixel';

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
    <>
      <div ref={layerRef} className="skin-layer" data-for={slug} data-mood="" aria-hidden={slug === 'robot' || slug === 'canh-cut' ? undefined : true}>
        <div className="skin-scene" />
        <SkinBackdrop slug={slug} />
        {hasClouds && <SkinClouds slug={slug} particles={particles} />}
        {fx.particles && !hasClouds && (
          <div className="skin-particles" data-kind={fx.particles}>
            {particles.map((style, i) => <i key={i} style={style} />)}
          </div>
        )}
        <SkinActors slug={slug} />
      </div>
      {slug === 'noel' && <SantaDelivery />}
      {slug === 'tet' && <TetEnvelope />}
    </>
  );
}
