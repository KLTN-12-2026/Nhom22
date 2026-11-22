'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useCardCycle(length, { interval = 10000, paused = false } = {}) {
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0);
  const hidden = useRef(false);

  const go = useCallback(next => {
    setIndex(current => ((typeof next === 'function' ? next(current) : next) + length) % length);
    setTick(value => value + 1);
  }, [length]);

  useEffect(() => {
    const onVisibility = () => { hidden.current = document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  useEffect(() => {
    if (paused || length < 2) return undefined;
    const timer = setTimeout(() => {
      if (hidden.current) setTick(value => value + 1);
      else go(current => current + 1);
    }, interval);
    return () => clearTimeout(timer);
  }, [paused, interval, length, tick, go]);

  const restart = useCallback(() => setTick(value => value + 1), []);

  return { index, tick, go, restart };
}
