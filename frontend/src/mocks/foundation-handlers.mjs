import { http, HttpResponse } from 'msw';

export const handlers = [http.get('*/api/v1/public/ping', () => HttpResponse.json({ status: 'UP', serverTime: new Date().toISOString() }))];
