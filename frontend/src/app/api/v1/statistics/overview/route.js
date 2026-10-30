import { NextResponse } from 'next/server';
import { backendJson, jsonError, proxyOrMock } from '@/app/api/v1/_mock/backend';
import { mockStore } from '@/app/api/v1/_mock/store';

const DAY = 86400000;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const dayInZone = (instant, zone) => new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(instant));
const shift = (day, n) => new Date(Date.parse(`${day}T12:00:00Z`) + n * DAY).toISOString().slice(0, 10);

function dateRange(params, zone) {
  const den = params.get('denNgay') || dayInZone(Date.now(), zone);
  const tu = params.get('tuNgay') || (DATE.test(den) ? shift(den, -6) : den);
  const errors = [];
  if (!DATE.test(tu)) errors.push({ field: 'tuNgay', message: 'Ngày bắt đầu không hợp lệ' });
  if (!DATE.test(den)) errors.push({ field: 'denNgay', message: 'Ngày kết thúc không hợp lệ' });
  if (!errors.length && tu > den) errors.push({ field: 'tuNgay', message: 'Ngày bắt đầu phải trước ngày kết thúc' });
  if (!errors.length && (Date.parse(den) - Date.parse(tu)) / DAY > 89) errors.push({ field: 'tuNgay', message: 'Chọn khoảng tối đa 90 ngày' });
  if (errors.length) return { errors };
  const days = [];
  for (let day = tu; day <= den; day = shift(day, 1)) days.push(day);
  return { tu, den, days };
}

async function reviews(req, range, boTheId) {
  const rows = [];
  for (let page = 0; page < 10; page++) {
    const query = new URLSearchParams({ tuNgay: range.tu, denNgay: range.den, size: '100', page: String(page) });
    if (boTheId) query.set('boTheId', boTheId);
    const data = await backendJson(req, `/api/v1/learning/history?${query}`);
    rows.push(...(data?.items || []));
    if (!data || page + 1 >= data.totalPages) break;
  }
  return rows;
}

async function overview(req) {
  const [me, today] = await Promise.all([backendJson(req, '/api/v1/me'), backendJson(req, '/api/v1/learning/today')]);
  const muiGio = me?.muiGio || 'Asia/Ho_Chi_Minh';
  const params = req.nextUrl.searchParams;
  const range = dateRange(params, muiGio);
  if (range.errors) return jsonError(400, 'VALIDATION_FAILED', 'Dữ liệu không hợp lệ', range.errors);
  const boTheId = params.get('boTheId') || null;
  const byDay = Object.fromEntries(range.days.map(ngay => [ngay, { soLuotOn: 0, soCauLuyen: 0, ms: 0 }]));
  const counted = (await reviews(req, range, boTheId)).filter(row => byDay[dayInZone(row.createdAt, muiGio)]);
  counted.forEach(row => {
    const day = byDay[dayInZone(row.createdAt, muiGio)];
    day.soLuotOn++;
    day.ms += row.thoiGian || 0;
  });
  const attempts = mockStore(req).attempts.filter(a => (!boTheId || a.boTheId === boTheId) && byDay[dayInZone(a.nopAt, muiGio)]);
  attempts.forEach(a => {
    const day = byDay[dayInZone(a.nopAt, muiGio)];
    day.soCauLuyen += a.tongSoCau;
    day.ms += a.thoiGianMs;
  });
  const mucTieuPhutNgay = today?.phutMoiNgay || 10;
  const theoNgay = range.days.map(ngay => ({ ngay, soLuotOn: byDay[ngay].soLuotOn, soCauLuyen: byDay[ngay].soCauLuyen, soPhut: Math.floor(byDay[ngay].ms / 60000) }));
  const soCauDung = attempts.reduce((sum, a) => sum + a.soCauDung, 0);
  const tongSoCau = attempts.reduce((sum, a) => sum + a.tongSoCau, 0);
  return NextResponse.json({
    muiGio,
    tuNgay: range.tu,
    denNgay: range.den,
    boTheId,
    soTuDaHoc: new Set(counted.map(row => row.theId)).size,
    soLuotOn: counted.length,
    tyLeNho: counted.length ? Math.round(counted.filter(row => row.danhGia !== 'QUEN').length / counted.length * 100) : null,
    baiLuyen: { soBai: attempts.length, soCauDung, tongSoCau, tyLeDung: tongSoCau ? Math.round(soCauDung / tongSoCau * 100) : null },
    tongPhut: Math.floor(Object.values(byDay).reduce((sum, day) => sum + day.ms, 0) / 60000),
    mucTieuPhutNgay,
    soNgayCoHoc: theoNgay.filter(day => day.soLuotOn || day.soCauLuyen).length,
    soNgayDatMucTieu: theoNgay.filter(day => day.soPhut >= mucTieuPhutNgay).length,
    chuoiNgay: today?.chuoiNgay || 0,
    theoNgay
  });
}

export async function GET(req) {
  return proxyOrMock(req, '/api/v1/statistics/overview', () => overview(req));
}
