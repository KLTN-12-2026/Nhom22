import { NextResponse } from 'next/server';
import { proxyOrMock } from '@/app/api/v1/_mock/backend';
import { CONFUSING_PAIRS } from '@/app/api/v1/_mock/seed';

export async function GET(req) {
  return proxyOrMock(req, '/api/v1/learning/confusing-pairs', () => NextResponse.json(CONFUSING_PAIRS));
}
