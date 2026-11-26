'use client';
import { useEffect, useId, useState } from 'react';

const APPEAR_INTERVAL = 2 * 60 * 1000;
const VISIBLE_DURATION = 15 * 1000;

const MESSAGES = [
  'Chúc bạn năm mới bình an, mạnh khỏe và nhiều niềm vui!',
  'Chúc bạn và gia đình một năm mới an khang, vạn sự như ý!',
  'Năm mới học thêm điều hay, gặp thêm nhiều niềm vui nhé!',
  'Khai xuân bằng 5 phút ôn lại những từ bạn hay quên nhé!',
  'Mở bộ thẻ và ôn thêm 5 từ vựng để lấy may đầu năm nào!',
  'Dành vài phút ôn bài hôm nay để giữ chuỗi học tập nhé!',
];

export function TetEnvelope() {
  const messageId = useId();
  const [envelope, setEnvelope] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let hideTimer;
    const appearTimer = window.setInterval(() => {
      window.clearTimeout(hideTimer);
      setOpen(false);
      setEnvelope({
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60,
        message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)],
      });
      hideTimer = window.setTimeout(() => setEnvelope(null), VISIBLE_DURATION);
    }, APPEAR_INTERVAL);

    return () => {
      window.clearInterval(appearTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  const toggle = () => {
    if (!open) window.VLFx?.pet?.('crackle');
    setOpen(!open);
  };

  if (!envelope) return null;

  return (
    <div
      className="sk-tet-surprise"
      style={{ '--tet-x': `${envelope.x}%`, '--tet-y': `${envelope.y}%` }}
      data-note-above={envelope.y > 50}
    >
      <button
        className="sk-tet-envelope sk-hit"
        type="button"
        aria-label={open ? 'Đóng lì xì Tết' : 'Mở lì xì Tết'}
        aria-expanded={open}
        aria-controls={messageId}
        onClick={toggle}
        onKeyDown={event => { if (event.key === 'Escape') setOpen(false); }}
      >
        <svg viewBox="0 0 50 70" aria-hidden="true">
          <rect x="2" y="2" width="46" height="66" rx="4" fill="#d32f2f" />
          <path className="sk-tet-flap" d="M2 6Q2 2 6 2H44Q48 2 48 6V19L25 33 2 19Z" fill="#b71c1c" stroke="#ffca28" strokeWidth="1.5" />
          <circle cx="25" cy="34" r="7" fill="#ffca28" />
          <text x="25" y="38" fontSize="9" textAnchor="middle" fill="#b71c1c" fontWeight="700">福</text>
        </svg>
      </button>
      <div id={messageId} className={open ? 'sk-tet-note' : 'sr-only'} role="status">
        {open ? envelope.message : ''}
      </div>
    </div>
  );
}
