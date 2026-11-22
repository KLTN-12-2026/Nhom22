export const PERIODS = [
  { key: 'TUAN', label: 'Tuần này' },
  { key: 'THANG', label: 'Tháng này' }
];

export const LIMITS = [10, 50, 100];

export const leaderboardKey = (ky, gioiHan) => ['leaderboard', ky, gioiHan];

export const PODIUM_METAL = { 1: 'gold', 2: 'silver', 3: 'bronze' };

export function boardRows(data) {
  if (!data) return [];
  const top = data.top || [];
  const lastTop = top.length ? top[top.length - 1].hang : 0;
  const tail = [data.truocToi, data.toi]
    .filter(entry => entry && entry.hang > lastTop)
    .filter((entry, i, list) => list.findIndex(other => other.hang === entry.hang) === i)
    .sort((a, b) => a.hang - b.hang);
  const rows = top.map(entry => ({ type: 'entry', entry }));
  if (tail.length && tail[0].hang > lastTop + 1) rows.push({ type: 'gap', key: `gap-${lastTop}` });
  tail.forEach(entry => rows.push({ type: 'entry', entry }));
  return rows;
}

export function chaseLine(data) {
  const me = data?.toi;
  if (!me) return null;
  if (me.hang === 1) return 'Bạn đang dẫn đầu, giữ vững nhé!';
  const above = data.truocToi;
  if (!above) return null;
  const days = above.soNgay - me.soNgay;
  if (days > 0) return `Học đủ thêm ${days} ngày để vượt ${above.tenHienThi}`;
  const reviews = above.soLuotHopLe - me.soLuotHopLe + 1;
  return `Ôn thêm ${reviews} lượt để vượt ${above.tenHienThi}`;
}

export function periodLabel(data) {
  if (!data) return '';
  const fmt = value => {
    const [y, m, d] = value.split('-');
    return `${d}/${m}${data.ky === 'THANG' ? `/${y}` : ''}`;
  };
  return `${fmt(data.tuNgay)} – ${fmt(data.denNgay)}`;
}
