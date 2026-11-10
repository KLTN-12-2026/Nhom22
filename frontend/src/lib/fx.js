const api = () => (typeof window !== 'undefined' ? window.VLFx : undefined);

export const fx = {
  play: name => api()?.play(name),
  turn: el => api()?.turn(el),
  pop: el => api()?.pop(el),
  shake: el => api()?.shake(el),
  confetti: opts => api()?.confetti(opts),
  stamp: (host, text, opts) => api()?.stamp(host, text, opts),
  countUp: (el, to, opts) => {
    if (api()) api().countUp(el, to, opts);
    else if (el) el.textContent = `${to}${opts?.suffix || ''}`;
  },
  floatText: (from, text, tone) => api()?.floatText(from, text, tone),
  celebrate: (host, opts) => api()?.celebrate(host, opts),
  setSound: on => api()?.setSound(on),
  isSoundOn: () => api()?.isSoundOn() ?? true,
};

export const RATE_SOUND = { QUEN: 'forget', KHO: 'hard', NHO: 'good', DE: 'easy' };

export function nextReviewText(hanOnAt, now = Date.now()) {
  const ms = Date.parse(hanOnAt) - now;
  if (!Number.isFinite(ms)) return '';
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `Gặp lại sau ${minutes} phút`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Gặp lại sau ${hours} giờ`;
  return `Gặp lại sau ${Math.round(hours / 24)} ngày`;
}
