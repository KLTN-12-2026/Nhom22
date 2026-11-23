'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Modal } from '@/components/ui';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { isForward, tourCue } from '@/lib/onboarding-tour.mjs';
import styles from './OnboardingTour.module.css';

const PAUSED = 'vl-tour-paused';
const RATED = 'vl-tour-rated';
const PAD = 6;
const GAP = 12;

function readSession(key) {
  try { return window.sessionStorage.getItem(key); } catch { return null; }
}

function writeSession(key, value) {
  try {
    if (value == null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {}
}

function sameRect(a, b) {
  return a && b && Math.abs(a.top - b.top) < 1 && Math.abs(a.left - b.left) < 1
    && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1;
}

function focusableIn(element) {
  if (element.matches('a, button, input, select, textarea, [tabindex]')) return element;
  return element.querySelector('a, button:not([disabled]), input, select, textarea, [tabindex]');
}

export function OnboardingTour() {
  const pathname = usePathname();
  const router = useRouter();
  const { tour, advance } = useOnboardingTour();
  const [paused, setPaused] = useState(false);
  const [rated, setRated] = useState(0);
  const [celebrate, setCelebrate] = useState(false);
  const [found, setFound] = useState(null);
  const [nudge, setNudge] = useState(0);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [bubbleHeight, setBubbleHeight] = useState(180);
  const bubble = useRef(null);
  const target = useRef(null);
  const sent = useRef(new Set());
  const tourRef = useRef(tour);

  useEffect(() => {
    tourRef.current = tour;
  }, [tour]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPaused(readSession(PAUSED) === '1');
      setRated(Number(readSession(RATED)) || 0);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const go = useCallback((buocHuongDan, boSaoChepId) => {
    const current = tourRef.current;
    if (!current || !isForward(current.buocHuongDan, buocHuongDan)) return;
    const key = `${buocHuongDan}:${boSaoChepId || ''}`;
    if (sent.current.has(key)) return;
    sent.current.add(key);
    advance.mutate({ buocHuongDan, boSaoChepId }, {
      onSuccess: data => { if (data?.buocHuongDan === 'HOAN_TAT') setCelebrate(true); },
      onError: () => sent.current.delete(key)
    });
  }, [advance]);

  useEffect(() => {
    const onSignal = event => {
      const type = event.detail?.type;
      if (type === 'resume') { writeSession(PAUSED, null); setPaused(false); }
      if (type === 'restart') { writeSession(PAUSED, null); writeSession(RATED, null); sent.current.clear(); setPaused(false); setRated(0); }
      if (type === 'card-saved' && tourRef.current?.buocHuongDan === 'THEM_TU') go('HOAN_TAT');
    };
    window.addEventListener('vocab:tour', onSignal);
    return () => window.removeEventListener('vocab:tour', onSignal);
  }, [go]);

  useEffect(() => {
    if (tour?.buocHuongDan !== 'HOC_BO_KHOI_DONG') return undefined;
    const onClick = event => {
      if (!event.target.closest?.('[data-tour="rates"] button')) return;
      setRated(value => {
        const next = value + 1;
        writeSession(RATED, String(next));
        return next;
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [tour?.buocHuongDan]);

  const cue = useMemo(() => tourCue(tour, pathname, { sessionRated: rated }), [tour, pathname, rated]);
  const active = cue?.targets && !paused ? cue : null;

  useEffect(() => {
    if (cue?.advanceTo && !cue.targets) go(cue.advanceTo);
  }, [cue, go]);

  useEffect(() => {
    if (!active) {
      target.current = null;
      const timer = setTimeout(() => setFound(null), 0);
      return () => clearTimeout(timer);
    }
    let scrolled = null;
    const measure = () => {
      setViewport(prev => prev.width === window.innerWidth && prev.height === window.innerHeight
        ? prev : { width: window.innerWidth, height: window.innerHeight });
      let element = null;
      let selector = null;
      for (const candidate of active.targets) {
        const match = document.querySelector(candidate);
        if (match && match.getClientRects().length > 0) { element = match; selector = candidate; break; }
      }
      if (element && active.advanceOn && selector === active.advanceOn) {
        const copyId = element.getAttribute('data-deck-id');
        if (copyId && copyId !== tourRef.current?.boKhoiDongId) go('MO_BO_SAO_CHEP', copyId);
      }
      const dialog = document.querySelector('dialog[open]');
      if (!element || (dialog && !dialog.contains(element))) {
        target.current = null;
        setFound(prev => (prev ? null : prev));
        return;
      }
      target.current = element;
      if (scrolled !== element) {
        scrolled = element;
        element.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      const box = element.getBoundingClientRect();
      const rect = { top: box.top, left: box.left, width: box.width, height: box.height };
      setFound(prev => (prev && prev.selector === selector && sameRect(prev.rect, rect) ? prev : { selector, rect }));
    };
    const first = setTimeout(measure, 0);
    const timer = setInterval(measure, 200);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [active, go]);

  const pause = useCallback(() => {
    writeSession(PAUSED, '1');
    setPaused(true);
  }, []);

  const forcing = active?.mode === 'force' && !!found;

  useEffect(() => {
    if (!found) return undefined;
    const frame = requestAnimationFrame(() => {
      const height = bubble.current?.offsetHeight;
      if (height) setBubbleHeight(prev => (Math.abs(prev - height) < 2 ? prev : height));
    });
    return () => cancelAnimationFrame(frame);
  });

  useEffect(() => {
    if (!found) return undefined;
    const onKey = event => { if (event.key === 'Escape') pause(); };
    const onFocus = event => {
      if (!forcing) return;
      const inBubble = bubble.current?.contains(event.target);
      const inTarget = !active.lockTarget && target.current?.contains(event.target);
      if (inBubble || inTarget) return;
      const next = active.lockTarget ? bubble.current?.querySelector('button') : focusableIn(target.current);
      next?.focus({ preventScroll: true });
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocus);
    };
  }, [found, forcing, active, pause]);

  const onAction = () => {
    const action = active?.action;
    if (!action) return;
    if (action.advanceTo) go(action.advanceTo);
    if (action.go) router.push(action.go);
  };

  const finishModal = (
    <Modal isOpen={celebrate} onClose={() => setCelebrate(false)} title="Xong nhiệm vụ đầu tiên!"
      footer={<button type="button" className="btn btn-primary" onClick={() => { setCelebrate(false); router.push('/hom-nay'); }}>Về trang Hôm nay</button>}>
      <div className={styles.finish}>
        <img src="/shared/assets/mascot-mark.svg" alt="" width="56" height="56" />
        <div className="stack-sm">
          <p>Bạn đã biết đủ để tự học: học bộ thẻ, chấm mức nhớ, lấy bộ từ thư viện và thêm từ của riêng mình.</p>
          <p className="muted small">Từ ngày mai, chỉ cần mở “Hôm nay”. Những từ đến hạn ôn đã được xếp sẵn cho bạn.</p>
        </div>
      </div>
    </Modal>
  );

  if (!active || !found) return finishModal;

  const { rect } = found;
  const copy = active.steps?.[found.selector] || active;
  const hole = {
    top: Math.max(0, rect.top - PAD),
    left: Math.max(0, rect.left - PAD),
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2
  };
  const vw = viewport.width || 1024;
  const vh = viewport.height || 768;
  const width = Math.min(360, vw - 32);
  const left = Math.min(Math.max(16, hole.left), Math.max(16, vw - width - 16));
  const below = hole.top + hole.height + GAP;
  const roomBelow = vh - below - GAP;
  const roomAbove = hole.top - GAP * 2;
  const placeBelow = roomBelow >= bubbleHeight || (roomAbove < bubbleHeight && roomBelow >= roomAbove);
  const fitsOutside = roomBelow >= bubbleHeight || roomAbove >= bubbleHeight;
  const bubbleStyle = !fitsOutside
    ? { bottom: GAP, left: vw >= 720 ? vw - width - 24 : left, width }
    : placeBelow
      ? { top: Math.max(GAP, Math.min(below, vh - bubbleHeight - GAP)), left, width }
      : { bottom: Math.max(GAP, vh - hole.top + GAP), left, width };
  const bottom = hole.top + hole.height;
  const right = hole.left + hole.width;

  return (
    <>
      {forcing && (
        <div className={styles.blockers} onClick={() => setNudge(value => value + 1)} aria-hidden="true">
          <div className={styles.shade} style={{ top: 0, left: 0, right: 0, height: hole.top }} />
          <div className={styles.shade} style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
          <div className={styles.shade} style={{ top: hole.top, left: 0, width: hole.left, height: hole.height }} />
          <div className={styles.shade} style={{ top: hole.top, left: right, right: 0, height: hole.height }} />
          {active.lockTarget && <div className={styles.lock} style={hole} />}
        </div>
      )}
      <div className={`${styles.ring} ${forcing ? styles.ringForce : ''}`} style={hole} aria-hidden="true" />
      <section
        ref={bubble}
        key={nudge}
        className={`${styles.bubble} ${copy.compact ? styles.compact : ''} ${nudge ? styles.nudge : ''}`}
        style={bubbleStyle}
        role="dialog"
        aria-modal={forcing || undefined}
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
      >
        <p className={styles.code}><span>{active.code}</span><span>Hướng dẫn</span></p>
        <h2 id="tour-title" className={styles.title}>{copy.title}</h2>
        <p id="tour-body" className={styles.body} aria-live="polite">{copy.body}</p>
        {forcing && !active.lockTarget && !copy.compact && <p className={styles.pointer}>Bấm vào vùng đang sáng để tiếp tục.</p>}
        <div className={styles.actions}>
          {active.action && <button type="button" className="btn btn-primary btn-sm" onClick={onAction}>{active.action.label}</button>}
          <button type="button" className="btn btn-quiet btn-sm" onClick={pause}>Để sau</button>
        </div>
      </section>
      {finishModal}
    </>
  );
}
