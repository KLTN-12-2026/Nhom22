import { NextResponse } from 'next/server';
import { proxyOrMock } from '@/app/api/v1/_mock/backend';
import { mockStore } from '@/app/api/v1/_mock/store';
import { SKILL_OF, SKILLS } from '@/app/api/v1/_mock/seed';

const MIN_OBSERVATIONS = 5;
const percent = rows => rows.length ? Math.round(rows.filter(row => row.dung).length / rows.length * 100) : null;

function skills(req) {
  const boTheId = req.nextUrl.searchParams.get('boTheId');
  const answers = mockStore(req).attempts
    .filter(a => !boTheId || a.boTheId === boTheId)
    .flatMap(a => a.ketQua.map(item => ({ kyNang: SKILL_OF[item.loaiCau], dung: item.dung, lanDau: !a.laLuyenLai })));
  return NextResponse.json(SKILLS.map(kyNang => {
    const rows = answers.filter(row => row.kyNang === kyNang);
    const recent = rows.slice(-20);
    const duDuLieu = rows.length >= MIN_OBSERVATIONS;
    return {
      kyNang,
      soQuanSat: rows.length,
      soLuotTinh: recent.length,
      duDuLieu,
      mucLamChu: duDuLieu ? percent(recent) : null,
      tyLeDungLanDau: percent(rows.filter(row => row.lanDau)),
      tyLeDungSauLuyenLai: percent(rows.filter(row => !row.lanDau)),
      soQuanSatToiThieu: MIN_OBSERVATIONS,
      nguon: 'BAI_LUYEN'
    };
  }));
}

export async function GET(req) {
  return proxyOrMock(req, '/api/v1/statistics/skills', () => skills(req));
}
