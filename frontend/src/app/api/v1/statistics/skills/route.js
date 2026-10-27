'use strict';
import { NextResponse } from 'next/server';

const SKILLS_DATA = [
  {
    kyNang: 'NHAN_NGHIA',
    soQuanSat: 10,
    soLuotTinh: 10,
    duDuLieu: true,
    mucLamChu: 3,
    tyLeDungLanDau: 0,
    tyLeDungSauLuyenLai: 0,
    soQuanSatToiThieu: 5,
    nguon: 'BAI_LUYEN'
  },
  {
    kyNang: 'CHINH_TA',
    soQuanSat: 1,
    soLuotTinh: 1,
    duDuLieu: false,
    mucLamChu: null,
    tyLeDungLanDau: null,
    tyLeDungSauLuyenLai: null,
    soQuanSatToiThieu: 5,
    nguon: 'BAI_LUYEN'
  },
  {
    kyNang: 'NGHE',
    soQuanSat: 0,
    soLuotTinh: 0,
    duDuLieu: false,
    mucLamChu: null,
    tyLeDungLanDau: null,
    tyLeDungSauLuyenLai: null,
    soQuanSatToiThieu: 5,
    nguon: 'BAI_LUYEN'
  },
  {
    kyNang: 'NGU_CANH',
    soQuanSat: 0,
    soLuotTinh: 0,
    duDuLieu: false,
    mucLamChu: null,
    tyLeDungLanDau: null,
    tyLeDungSauLuyenLai: null,
    soQuanSatToiThieu: 5,
    nguon: 'BAI_LUYEN'
  },
  {
    kyNang: 'CAP_NHAM',
    soQuanSat: 0,
    soLuotTinh: 0,
    duDuLieu: false,
    mucLamChu: null,
    tyLeDungLanDau: null,
    tyLeDungSauLuyenLai: null,
    soQuanSatToiThieu: 5,
    nguon: 'BAI_LUYEN'
  }
];

async function tryProxyToBackend(req) {
  const beBase = (process.env.API_URL || 'http://localhost:8080').replace(/\/$/, '');
  const url = `${beBase}/api/v1/statistics/skills${req.nextUrl.search}`;
  try {
    const headers = new Headers();
    const cookie = req.headers.get('cookie');
    if (cookie) headers.set('cookie', cookie);
    const beRes = await fetch(url, { headers });
    if ([200, 201, 204].includes(beRes.status)) {
      const resBody = await beRes.text();
      return new NextResponse(resBody, {
        status: beRes.status,
        headers: { 'content-type': beRes.headers.get('content-type') || 'application/json' }
      });
    }
  } catch (e) {}
  return null;
}

export async function GET(req) {
  const proxy = await tryProxyToBackend(req);
  if (proxy) return proxy;

  return NextResponse.json(SKILLS_DATA);
}
