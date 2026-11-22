export const SNAP_FORMATS = [
  { key: 'portrait', label: 'Dọc 4:5', hint: 'Bài đăng', width: 1080, height: 1350 },
  { key: 'square', label: 'Vuông 1:1', hint: 'Tin nhắn', width: 1080, height: 1080 },
  { key: 'story', label: 'Story 9:16', hint: 'Tin, Reels', width: 1080, height: 1920 },
];

export const SNAP_THEMES = [
  {
    key: 'giay', label: 'Giấy',
    desk: '#ebe6d8', deskDot: 'rgba(36,38,44,.07)', sheet: '#fffdf8', ink: '#24262c', ink2: '#474b55', ink3: '#62677a',
    line: '#e6e2d6', line2: '#d8d3c4', timing: '#15161a', primary: '#3549bb', primaryTint: '#eceef9', fill: '#3549bb', onFill: '#ffffff', shadow: 'rgba(40,36,20,.18)',
  },
  {
    key: 'cham', label: 'Chàm',
    desk: '#2c3b9e', deskDot: 'rgba(255,255,255,.08)', sheet: '#fffdf8', ink: '#24262c', ink2: '#474b55', ink3: '#62677a',
    line: '#e6e2d6', line2: '#d8d3c4', timing: '#15161a', primary: '#3549bb', primaryTint: '#eceef9', fill: '#3549bb', onFill: '#ffffff', shadow: 'rgba(8,12,48,.45)',
  },
  {
    key: 'dem', label: 'Đêm',
    desk: '#111318', deskDot: 'rgba(255,255,255,.05)', sheet: '#20252d', ink: '#f1f0eb', ink2: '#c2c7d1', ink3: '#a2aabc',
    line: '#2f3641', line2: '#3a424f', timing: '#7c8598', primary: '#aab8ff', primaryTint: '#2d344b', fill: '#5262c9', onFill: '#ffffff', shadow: 'rgba(0,0,0,.55)',
  },
];

const WORD = '"Gentium Book Plus", "Gentium Plus", Georgia, serif';
const FORM = '"Archivo", "Segoe UI", system-ui, sans-serif';

export async function loadSnapFonts() {
  if (typeof document === 'undefined' || !document.fonts) return;
  const faces = [`700 96px ${WORD}`, `italic 400 40px ${WORD}`, `400 40px ${WORD}`, `700 40px ${FORM}`, `600 40px ${FORM}`, `500 40px ${FORM}`, `400 40px ${FORM}`];
  try { await Promise.all(faces.map(face => document.fonts.load(face, 'Aaăêôơư'))); await document.fonts.ready; } catch {}
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function loadRemoteImage(url) {
  if (!url) return null;
  try {
    const response = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!response.ok) return null;
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    try { return await loadImage(objectUrl); } finally { setTimeout(() => URL.revokeObjectURL(objectUrl), 0); }
  } catch { return null; }
}

function font(weight, size, family, style = 'normal') {
  return `${style} ${weight} ${Math.round(size)}px ${family}`;
}

function wrap(ctx, text, maxWidth, maxLines) {
  const words = String(text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) { current = next; continue; }
    lines.push(current);
    current = word;
  }
  if (current) lines.push(current);
  for (let i = 0; i < lines.length; i += 1) {
    while (ctx.measureText(lines[i]).width > maxWidth && lines[i].length > 1) lines[i] = lines[i].slice(0, -1);
  }
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  let last = `${kept[maxLines - 1]}…`;
  while (ctx.measureText(last).width > maxWidth && last.length > 2) last = `${last.slice(0, -2)}…`;
  kept[maxLines - 1] = last;
  return kept;
}

function balanced(ctx, text, maxWidth, maxLines) {
  const lines = wrap(ctx, text, maxWidth, maxLines);
  if (lines.length < 2 || lines[lines.length - 1].endsWith('…')) return lines;
  let low = maxWidth * 0.5;
  let high = maxWidth;
  for (let i = 0; i < 12; i += 1) {
    const mid = (low + high) / 2;
    if (wrap(ctx, text, mid, maxLines + 1).length > lines.length) low = mid; else high = mid;
  }
  return wrap(ctx, text, Math.ceil(high) + 1, maxLines);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipsize(ctx, text, maxWidth) {
  let value = String(text || '');
  if (ctx.measureText(value).width <= maxWidth) return value;
  while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) value = value.slice(0, -1);
  return `${value}…`;
}

function drawDesk(ctx, W, H, t) {
  ctx.fillStyle = t.desk;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = t.deskDot;
  for (let y = 18; y < H; y += 36) {
    for (let x = (y / 36) % 2 ? 18 : 36; x < W; x += 36) {
      ctx.beginPath(); ctx.arc(x, y, 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawSheet(ctx, x, y, w, h, t) {
  ctx.save();
  ctx.shadowColor = t.shadow;
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 24;
  roundRect(ctx, x, y, w, h, 28);
  ctx.fillStyle = t.sheet;
  ctx.fill();
  ctx.restore();
  ctx.save();
  roundRect(ctx, x, y, w, h, 28);
  ctx.clip();
  ctx.fillStyle = t.timing;
  for (let my = y + 64; my < y + h - 56; my += 44) ctx.fillRect(x + 22, my, 16, 8);
  ctx.restore();
  ctx.save();
  roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 28);
  ctx.strokeStyle = t.line2;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawStamp(ctx, text, x, y, t, { size = 26, solid = false } = {}) {
  ctx.font = font(700, size, FORM);
  const padX = size * 0.62;
  const h = size * 1.75;
  const w = ctx.measureText(text).width + padX * 2;
  roundRect(ctx, x, y, w, h, h / 2);
  if (solid) { ctx.fillStyle = t.fill; ctx.fill(); }
  else { ctx.strokeStyle = t.primary; ctx.lineWidth = 2.5; ctx.stroke(); }
  ctx.fillStyle = solid ? t.onFill : t.primary;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX, y + h / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  return w;
}

function coverImage(ctx, image, x, y, w, h, r) {
  const scale = Math.max(w / image.width, h / image.height);
  const sw = w / scale;
  const sh = h / scale;
  ctx.save();
  roundRect(ctx, x, y, w, h, r);
  ctx.clip();
  ctx.drawImage(image, (image.width - sw) / 2, (image.height - sh) / 2, sw, sh, x, y, w, h);
  ctx.restore();
}

function layout(ctx, card, opts, frame, scale) {
  const { t, image, format } = opts;
  const { x, w } = frame;
  const s = scale;
  const blocks = [];
  const showImage = image && format !== 'square';

  if (showImage) {
    const ratio = image.height / image.width;
    const ih = Math.min(Math.max(w * ratio, w * 0.42), format === 'story' ? w * 0.72 : w * 0.5) * s;
    blocks.push({ h: ih + 48 * s, draw: y => coverImage(ctx, image, x, y, w, ih, 22) });
  }

  let wordSize = 132 * s;
  ctx.font = font(700, wordSize, WORD);
  while (wordSize > 84 * s && ctx.measureText(card.tu).width > w) {
    wordSize -= 4 * s;
    ctx.font = font(700, wordSize, WORD);
  }
  const wordLines = balanced(ctx, card.tu, w, 2);
  const wordLead = wordSize * 1.08;
  blocks.push({
    h: wordLines.length * wordLead + 8 * s,
    draw: y => {
      ctx.font = font(700, wordSize, WORD);
      ctx.fillStyle = t.ink;
      wordLines.forEach((line, i) => ctx.fillText(line, x, y + wordSize * 0.86 + i * wordLead));
    },
  });

  if (card.phienAm || card.tuLoai) {
    const ipaSize = 42 * s;
    blocks.push({
      h: 64 * s,
      draw: y => {
        let cx = x;
        if (card.phienAm) {
          ctx.font = font(400, ipaSize, WORD, 'italic');
          ctx.fillStyle = t.ink3;
          const ipa = ellipsize(ctx, card.phienAm, w * 0.66);
          ctx.fillText(ipa, cx, y + ipaSize * 0.95);
          cx += ctx.measureText(ipa).width + 22 * s;
        }
        if (card.tuLoai) drawStamp(ctx, card.tuLoai, cx, y + 4 * s, t, { size: 24 * s });
      },
    });
  }

  blocks.push({
    h: 56 * s,
    draw: y => {
      ctx.fillStyle = t.ink;
      ctx.fillRect(x, y + 24 * s, w, 3);
      ctx.fillStyle = t.line2;
      ctx.fillRect(x, y + 32 * s, w, 1.5);
    },
  });

  const meanSize = (format === 'square' ? 50 : 56) * s;
  ctx.font = font(600, meanSize, FORM);
  const meanLines = balanced(ctx, card.nghiaVi, w, format === 'story' ? 5 : 3);
  const meanLead = meanSize * 1.28;
  blocks.push({
    h: 40 * s + meanLines.length * meanLead + 12 * s,
    draw: y => {
      ctx.font = font(600, 24 * s, FORM);
      ctx.fillStyle = t.ink3;
      ctx.fillText('Nghĩa', x, y + 24 * s);
      ctx.font = font(600, meanSize, FORM);
      ctx.fillStyle = t.ink;
      meanLines.forEach((line, i) => ctx.fillText(line, x, y + 40 * s + meanSize * 0.95 + i * meanLead));
    },
  });

  if (card.viDuEn) {
    const exSize = 38 * s;
    const viSize = 30 * s;
    const inner = w - 64 * s;
    ctx.font = font(400, exSize, WORD, 'italic');
    const exLines = balanced(ctx, card.viDuEn, inner, format === 'square' ? 2 : 3);
    ctx.font = font(400, viSize, FORM);
    const viLines = card.dichVi ? wrap(ctx, card.dichVi, inner, 2) : [];
    const exLead = exSize * 1.32;
    const viLead = viSize * 1.36;
    const boxH = 36 * s + exLines.length * exLead + (viLines.length ? 14 * s + viLines.length * viLead : 0) + 30 * s;
    blocks.push({
      h: 28 * s + boxH,
      draw: y => {
        const top = y + 28 * s;
        roundRect(ctx, x, top, w, boxH, 18);
        ctx.fillStyle = t.primaryTint;
        ctx.fill();
        ctx.fillStyle = t.primary;
        ctx.fillRect(x, top + 18, 7, boxH - 36);
        ctx.font = font(400, exSize, WORD, 'italic');
        ctx.fillStyle = t.ink;
        let cy = top + 36 * s;
        exLines.forEach(line => { ctx.fillText(line, x + 38 * s, cy + exSize * 0.9); cy += exLead; });
        if (viLines.length) {
          cy += 14 * s;
          ctx.font = font(400, viSize, FORM);
          ctx.fillStyle = t.ink2;
          viLines.forEach(line => { ctx.fillText(line, x + 38 * s, cy + viSize * 0.9); cy += viLead; });
        }
      },
    });
  }

  const level = Math.min(Math.max(Number(card.doKho) || 0, 0), 5);
  if (level > 0) {
    blocks.push({
      h: 76 * s,
      draw: y => {
        const r = 13 * s;
        const cy = y + 44 * s;
        for (let i = 0; i < 5; i += 1) {
          ctx.beginPath();
          ctx.arc(x + r + i * (r * 2 + 12 * s), cy, r, 0, Math.PI * 2);
          if (i < level) { ctx.fillStyle = t.fill; ctx.fill(); }
          else { ctx.strokeStyle = t.ink3; ctx.lineWidth = 2.5; ctx.stroke(); }
        }
        ctx.font = font(600, 26 * s, FORM);
        ctx.fillStyle = t.ink3;
        ctx.textBaseline = 'middle';
        ctx.fillText(`Độ khó ${level}/5`, x + 5 * (r * 2 + 12 * s) + 10 * s, cy + 1);
        ctx.textBaseline = 'alphabetic';
      },
    });
  }
  return blocks;
}

export async function renderCardSnapshot(canvas, card, { format = 'portrait', theme = 'giay', deckName = '', link = '', number = null, image = null, mascot = null } = {}) {
  const size = SNAP_FORMATS.find(item => item.key === format) || SNAP_FORMATS[0];
  const t = SNAP_THEMES.find(item => item.key === theme) || SNAP_THEMES[0];
  const W = size.width;
  const H = size.height;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = 'alphabetic';
  ctx.imageSmoothingQuality = 'high';
  drawDesk(ctx, W, H, t);

  const margin = format === 'story' ? 72 : 56;
  const sx = margin;
  const sy = format === 'story' ? 150 : margin;
  const sw = W - margin * 2;
  const sh = H - sy - (format === 'story' ? 190 : margin);
  drawSheet(ctx, sx, sy, sw, sh, t);

  const padL = 92;
  const padR = 64;
  const cx = sx + padL;
  const cw = sw - padL - padR;
  const headerTop = sy + 52;

  if (mascot) ctx.drawImage(mascot, cx, headerTop - 4, 64, 64);
  ctx.font = font(800, 34, FORM);
  ctx.fillStyle = t.ink;
  const brandX = cx + (mascot ? 80 : 0);
  ctx.fillText('Vocab', brandX, headerTop + 42);
  const vocabW = ctx.measureText('Vocab').width;
  ctx.fillStyle = t.primary;
  ctx.fillText('Learning', brandX + vocabW, headerTop + 42);
  ctx.font = font(700, 24, FORM);
  const label = number ? `Thẻ số ${number}` : 'Thẻ từ vựng';
  const labelW = ctx.measureText(label).width + 30;
  drawStamp(ctx, label, cx + cw - labelW, headerTop + 8, t, { size: 24, solid: true });

  const headerBottom = headerTop + 100;
  const footerH = 96;
  const footerTop = sy + sh - footerH - 28;
  const available = footerTop - headerBottom - 24;

  const fill = format === 'story' ? 0.82 : 0.9;
  let scale = format === 'story' ? 1.7 : format === 'square' ? 1.2 : 1.35;
  let blocks = layout(ctx, card, { t, image, format }, { x: cx, w: cw }, scale);
  let total = blocks.reduce((sum, block) => sum + block.h, 0);
  while (total > available * fill && scale > 0.55) {
    scale -= 0.05;
    blocks = layout(ctx, card, { t, image, format }, { x: cx, w: cw }, scale);
    total = blocks.reduce((sum, block) => sum + block.h, 0);
  }
  let y = headerBottom + Math.max(0, (available - total) * 0.45);
  for (const block of blocks) { block.draw(y); y += block.h; }

  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.strokeStyle = t.line2;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, footerTop + 8);
  ctx.lineTo(cx + cw, footerTop + 8);
  ctx.stroke();
  ctx.restore();

  ctx.font = font(500, 22, FORM);
  ctx.fillStyle = t.ink3;
  ctx.fillText(deckName ? 'Trong bộ thẻ' : 'Học cùng', cx, footerTop + 48);
  ctx.font = font(700, 30, FORM);
  ctx.fillStyle = t.ink;
  ctx.fillText(ellipsize(ctx, deckName || 'VocabLearning', cw * 0.56), cx, footerTop + 86);
  if (link) {
    ctx.font = font(600, 24, FORM);
    ctx.fillStyle = t.primary;
    ctx.textAlign = 'right';
    ctx.fillText(ellipsize(ctx, link, cw * 0.4), cx + cw, footerTop + 86);
    ctx.font = font(500, 22, FORM);
    ctx.fillStyle = t.ink3;
    ctx.fillText('Học bộ này tại', cx + cw, footerTop + 48);
    ctx.textAlign = 'left';
  }

  if (format === 'story') {
    ctx.font = font(800, 42, FORM);
    ctx.fillStyle = t.key === 'giay' ? t.ink : '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('Mỗi ngày một từ mới', W / 2, 98);
    ctx.font = font(500, 30, FORM);
    ctx.globalAlpha = 0.8;
    ctx.fillText('Lật thẻ, nghe phát âm, ôn đúng lúc sắp quên', W / 2, H - 88);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  return canvas;
}

export function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Không tạo được ảnh'))), 'image/png'));
}

export function snapFileName(card) {
  const slug = String(card.tu || 'the').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'the';
  return `vocablearning-${slug}.png`;
}
