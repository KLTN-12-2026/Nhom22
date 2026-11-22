'use client';
import { useId } from 'react';
import { METALS, METAL_PATHS } from '@/lib/tier.mjs';

export function MetalIcon({ name, metal = 'silver', size = 20, delay, className = '' }) {
  const raw = useId().replace(/[^a-zA-Z0-9]/g, '');
  const c = METALS[metal] || METALS.silver;
  const d = METAL_PATHS[name];
  if (!d) return null;
  const begin = `${(delay ?? ([...raw].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 7) * 0.35).toFixed(2)}s`;
  const anim = values => <animate attributeName="offset" values={values} keyTimes="0;.55;1" dur="3.2s" begin={begin} repeatCount="indefinite" />;
  return <svg className={`metal-icon ${className}`} width={size} height={size} style={{ width: size, height: size }} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${raw}b`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={c[0]} /><stop offset=".3" stopColor={c[1]} /><stop offset=".52" stopColor={c[2]} /><stop offset=".7" stopColor={c[3]} /><stop offset="1" stopColor={c[4]} />
      </linearGradient>
      <linearGradient id={`${raw}s`} x1="0" y1="0" x2="1" y2=".6">
        <stop offset="0" stopColor="#fff" stopOpacity="0">{anim('-.6;1.2;1.2')}</stop>
        <stop offset="0" stopColor="#fff" stopOpacity=".95">{anim('-.4;1.4;1.4')}</stop>
        <stop offset="0" stopColor="#fff" stopOpacity="0">{anim('-.2;1.6;1.6')}</stop>
      </linearGradient>
      <linearGradient id={`${raw}e`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".7" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".35" />
      </linearGradient>
    </defs>
    <path d={d} fill={`url(#${raw}b)`} fillRule="evenodd" stroke={c[4]} strokeWidth=".6" strokeLinejoin="round" />
    <path d={d} fill={`url(#${raw}e)`} fillRule="evenodd" opacity=".55" />
    <path className="metal-shine" d={d} fill={`url(#${raw}s)`} fillRule="evenodd" />
  </svg>;
}
