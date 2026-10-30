import { NextResponse } from 'next/server';
import { dot2MockEnabled, shouldUseMock } from '@/lib/dot2-mock.mjs';

const REQUEST_HEADERS = ['accept', 'accept-language', 'content-type', 'cookie', 'idempotency-key', 'x-xsrf-token'];
const RESPONSE_HEADERS = ['content-type', 'location', 'retry-after'];

export function backendBase() {
  return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080').replace(/\/+$/, '');
}

export async function callBackend(req, path) {
  const headers = new Headers();
  REQUEST_HEADERS.forEach(name => {
    const value = req.headers.get(name);
    if (value) headers.set(name, value);
  });
  const init = { method: req.method, headers, cache: 'no-store', redirect: 'manual' };
  if (!['GET', 'HEAD'].includes(req.method)) {
    const body = await req.clone().text();
    if (body) init.body = body;
  }
  return fetch(`${backendBase()}${path}${req.nextUrl.search}`, init);
}

export async function backendJson(req, path) {
  try {
    const res = await fetch(`${backendBase()}${path}`, { headers: { cookie: req.headers.get('cookie') || '' }, cache: 'no-store' });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

function relay(res, body) {
  const headers = new Headers();
  RESPONSE_HEADERS.forEach(name => {
    const value = res.headers.get(name);
    if (value) headers.set(name, value);
  });
  (res.headers.getSetCookie?.() || []).forEach(cookie => headers.append('set-cookie', cookie));
  return new NextResponse([204, 304].includes(res.status) ? null : body, { status: res.status, headers });
}

function parse(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export async function proxyOrMock(req, path, mock) {
  const mockEnabled = dot2MockEnabled();
  let res;
  try {
    res = await callBackend(req, path);
  } catch {
    if (mockEnabled) return mock();
    return NextResponse.json({ code: 'SERVICE_UNAVAILABLE', message: 'Không kết nối được máy chủ. Vui lòng thử lại.' }, { status: 502 });
  }
  const text = await res.text();
  if (mockEnabled && shouldUseMock(res.status, parse(text))) return mock();
  return relay(res, text);
}

export const jsonError = (status, code, message, fieldErrors = []) =>
  NextResponse.json({ code, message, fieldErrors }, { status });
