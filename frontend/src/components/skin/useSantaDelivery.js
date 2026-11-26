'use client';
import { useEffect } from 'react';

const VISIT_INTERVAL = 2 * 60 * 1000;
const TRIP_DURATION = 12000;
const FALL_DURATION = 1600;
const GIFT_LIFETIME = 60000;
const NOTE_LIFETIME = 20000;
const MESSAGES = [
  'Chúc bạn Giáng sinh an lành, ấm áp bên những người thân yêu!',
  'Mong những điều tốt đẹp sẽ ghé thăm bạn trong mùa Giáng sinh này.',
  'Chúc bạn luôn vui vẻ và giữ được niềm vui học tập mỗi ngày!',
  'Noel vui vẻ! Mỗi chút cố gắng hôm nay đều đáng được trân trọng.',
  'Dành 5 phút ôn lại những từ khó hôm nay nhé!',
  'Mở bộ thẻ và ôn thêm 5 từ vựng nào!',
  'Đừng quên ôn bài hôm nay để giữ chuỗi học tập nhé!',
  'Học thêm 10 phút rồi dành một chút thời gian nghỉ ngơi nhé!',
];

export function useSantaDelivery(ref) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const rider = root.querySelector('.sk-santa-rider');
    const parcel = root.querySelector('.sk-santa-parcel');
    const button = root.querySelector('.sk-santa-open');
    const note = root.querySelector('.sk-santa-note');
    const message = root.querySelector('.sk-santa-message');
    const dismiss = root.querySelector('.sk-santa-dismiss');
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const timers = new Set();
    let stopped = false;
    let nextVisit = Date.now() + VISIT_INTERVAL;
    let nextTimer, dropTimer, leaveTimer, giftTimer, landTimer;
    let flight = null, fall = null;
    let lastMessage = -1;
    let parcelX = 0;
    let parcelY = 0;
    let dropX = 0;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    const later = (callback, delay) => {
      const timer = window.setTimeout(() => {
        timers.delete(timer);
        if (!stopped) callback();
      }, delay);
      timers.add(timer);
      return timer;
    };
    const cancel = timer => { window.clearTimeout(timer); timers.delete(timer); };

    const hideGift = () => {
      cancel(giftTimer);
      cancel(landTimer);
      fall?.cancel();
      fall = null;
      parcel.hidden = true;
      note.hidden = true;
      button.dataset.opened = 'false';
      button.setAttribute('aria-expanded', 'false');
    };
    const landGift = () => {
      cancel(landTimer);
      fall?.cancel();
      fall = null;
      button.style.transform = 'none';
      button.disabled = false;
    };
    const giftBounds = () => {
      const nav = document.querySelector('.bottom-nav')?.getBoundingClientRect();
      const rail = document.querySelector('.app-rail')?.getBoundingClientRect();
      const header = document.querySelector('.app-header')?.getBoundingClientRect();
      const maxX = Math.max(8, window.innerWidth - (button.offsetWidth || 56) - 20);
      const bottom = nav?.height ? nav.top : window.innerHeight;
      const maxY = Math.max(16, bottom - (button.offsetHeight || 64) - 24);
      return {
        minX: Math.min(maxX, (rail?.right || 0) + 20), maxX,
        minY: Math.min(maxY, (header?.bottom || 0) + 24), maxY,
      };
    };
    const placeGift = () => {
      const box = giftBounds();
      parcelX = clamp(parcelX, box.minX, box.maxX);
      parcelY = clamp(parcelY, box.minY, box.maxY);
      parcel.style.left = `${parcelX}px`;
      parcel.style.top = `${parcelY}px`;
      const noteWidth = Math.min(280, window.innerWidth - 32);
      note.style.left = `${clamp(parcelX + button.offsetWidth / 2 - noteWidth / 2, 16, window.innerWidth - noteWidth - 16) - parcelX}px`;
      const noteHeight = note.offsetHeight || 170;
      const above = parcelY - noteHeight - 14;
      const below = parcelY + button.offsetHeight + 14;
      const maxNoteY = Math.max(16, window.innerHeight - noteHeight - 16);
      const minNoteY = Math.min(box.minY, maxNoteY);
      const noteY = above >= minNoteY ? above : below <= maxNoteY ? below : clamp(above, minNoteY, maxNoteY);
      note.style.top = `${noteY - parcelY}px`;
      note.style.bottom = 'auto';
      return { x: parcelX, y: parcelY };
    };

    const dropGift = () => {
      if (rider.hidden || document.hidden) return;
      hideGift();
      const rect = rider.getBoundingClientRect();
      const sourceX = rect.left + rect.width * (rider.dataset.direction === 'right' ? .31 : .69);
      const sourceY = rect.top + rect.height * .43;
      parcel.hidden = false;
      button.disabled = !motion.matches;
      parcelX = (motion.matches ? dropX : sourceX) - button.offsetWidth / 2;
      const box = giftBounds();
      const minY = Math.min(box.maxY, Math.max(box.minY, sourceY + button.offsetHeight));
      parcelY = minY + Math.random() * (box.maxY - minY);
      const landing = placeGift();
      let index = Math.floor(Math.random() * (MESSAGES.length - (lastMessage < 0 ? 0 : 1)));
      if (lastMessage >= 0 && index >= lastMessage) index++;
      lastMessage = index;
      message.textContent = MESSAGES[index];
      if (!motion.matches) {
        fall = button.animate([
          { transform: `translate3d(${sourceX - landing.x - button.offsetWidth / 2}px, ${sourceY - landing.y - button.offsetHeight / 2}px, 0) rotate(-12deg)` },
          { offset: .8, transform: 'translate3d(0, 6px, 0) rotate(5deg)' },
          { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
        ], { duration: FALL_DURATION, easing: 'cubic-bezier(.3, .65, .4, 1)', fill: 'forwards' });
        landTimer = later(landGift, FALL_DURATION);
      }
      giftTimer = later(hideGift, GIFT_LIFETIME + (motion.matches ? 0 : FALL_DURATION));
    };
    const hideRider = () => {
      cancel(dropTimer);
      cancel(leaveTimer);
      flight?.cancel();
      flight = null;
      rider.hidden = true;
    };
    const startVisit = () => {
      nextTimer = null;
      if (document.hidden) return;
      hideRider();
      const width = Math.min(420, window.innerWidth * .9);
      const header = document.querySelector('.app-header')?.getBoundingClientRect();
      const top = (header?.bottom || 0) + 16;
      rider.style.width = `${width}px`;
      rider.style.top = `${top + Math.random() * Math.max(0, window.innerHeight * .35 - width * .4375 - top)}px`;
      rider.dataset.direction = Math.random() < .5 ? 'right' : 'left';
      rider.hidden = false;
      const from = rider.dataset.direction === 'right' ? -width - 40 : window.innerWidth + 40;
      const to = rider.dataset.direction === 'right' ? window.innerWidth + 40 : -width - 40;
      if (motion.matches) {
        rider.style.transform = `translate3d(${(window.innerWidth - width) / 2}px, 0, 0)`;
      } else {
        flight = rider.animate([
          { transform: `translate3d(${from}px, 0, 0)` },
          { transform: `translate3d(${to}px, 0, 0)` },
        ], { duration: TRIP_DURATION, easing: 'linear', fill: 'forwards' });
      }
      const box = giftBounds();
      dropX = box.minX + Math.random() * (box.maxX - box.minX) + (button.offsetWidth || 56) / 2;
      const anchor = rider.dataset.direction === 'right' ? .31 : .69;
      const progress = clamp((dropX - from - width * anchor) / (to - from), .05, .95);
      dropTimer = later(dropGift, TRIP_DURATION * progress);
      leaveTimer = later(hideRider, TRIP_DURATION);
      nextVisit = Date.now() + VISIT_INTERVAL;
      nextTimer = later(startVisit, VISIT_INTERVAL);
    };
    const openGift = () => {
      if (button.disabled || button.dataset.opened === 'true') return;
      button.dataset.opened = 'true';
      button.setAttribute('aria-expanded', 'true');
      note.hidden = false;
      placeGift();
      window.VLFx?.pet?.('jingle');
      cancel(giftTimer);
      giftTimer = later(hideGift, NOTE_LIFETIME);
    };
    const onVisibility = () => {
      if (document.hidden) { flight?.pause(); fall?.pause(); }
      else {
        flight?.play();
        fall?.play();
        if (Date.now() >= nextVisit) { cancel(nextTimer); startVisit(); }
      }
    };
    const onResize = () => {
      if (!parcel.hidden) { landGift(); placeGift(); }
    };
    const onMotion = () => {
      if (motion.matches && !rider.hidden) {
        flight?.cancel();
        flight = null;
        rider.style.transform = `translate3d(${(window.innerWidth - rider.offsetWidth) / 2}px, 0, 0)`;
      }
      onResize();
    };

    nextTimer = later(startVisit, VISIT_INTERVAL);
    button.addEventListener('click', openGift);
    dismiss.addEventListener('click', hideGift);
    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', onMotion);
    return () => {
      stopped = true;
      timers.forEach(timer => window.clearTimeout(timer));
      flight?.cancel();
      fall?.cancel();
      rider.hidden = true;
      parcel.hidden = true;
      button.removeEventListener('click', openGift);
      dismiss.removeEventListener('click', hideGift);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      motion.removeEventListener('change', onMotion);
    };
  }, [ref]);
}
