import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canResubmit, decidePublishRequest, listPublishRequests, reasonOf, submitPublishRequest, withdrawPublishRequest,
} from '../src/lib/publish-requests.mjs';

function recorder() {
  const calls = [];
  const fetcher = (url, options = {}) => { calls.push({ url, ...options }); return Promise.resolve({}); };
  return { calls, fetcher };
}

test('a copy can be resubmitted only when nothing is pending and the 24 hour wait is over', () => {
  const now = Date.parse('2026-11-21T10:00:00Z');
  assert.equal(canResubmit(null, now), true);
  assert.equal(canResubmit({ trangThai: 'CHO_DUYET' }, now), false);
  assert.equal(canResubmit({ trangThai: 'TU_CHOI', guiLaiSauAt: '2026-11-21T12:00:00Z' }, now), false);
  assert.equal(canResubmit({ trangThai: 'TU_CHOI', guiLaiSauAt: '2026-11-21T09:00:00Z' }, now), true);
  assert.equal(canResubmit({ trangThai: 'HET_HAN', guiLaiSauAt: null }, now), true);
});

test('requests hit the BE paths with the BE field names', async () => {
  const { calls, fetcher } = recorder();
  await submitPublishRequest(fetcher, '7', '  ');
  await withdrawPublishRequest(fetcher, '9');
  await listPublishRequests(fetcher, { trangThai: 'CHO_DUYET', page: 1 });
  await listPublishRequests(fetcher, { admin: true });
  await decidePublishRequest(fetcher, '9', { quyetDinh: 'TU_CHOI', lyDo: ' Nội dung chưa đủ ', version: 2 });
  await decidePublishRequest(fetcher, '9', { quyetDinh: 'DUYET', version: 0 }, true);

  assert.deepEqual(calls.map(call => [call.method || 'GET', call.url]), [
    ['POST', '/api/v1/decks/7/publish-requests'],
    ['DELETE', '/api/v1/publish-requests/9'],
    ['GET', '/api/v1/me/publish-requests?page=1&size=20&trangThai=CHO_DUYET'],
    ['GET', '/api/v1/admin/publish-requests?page=0&size=20'],
    ['POST', '/api/v1/publish-requests/9/decision'],
    ['POST', '/api/v1/admin/publish-requests/9/decision'],
  ]);
  assert.deepEqual(JSON.parse(calls[0].body), { loiNhan: null });
  assert.deepEqual(JSON.parse(calls[4].body), { quyetDinh: 'TU_CHOI', lyDo: 'Nội dung chưa đủ', version: 2 });
  assert.deepEqual(JSON.parse(calls[5].body), { quyetDinh: 'DUYET', lyDo: null, version: 0 });
});

test('the business reason is read from error details', () => {
  assert.equal(reasonOf({ data: { details: { lyDo: 'CHO_GUI_LAI' } } }), 'CHO_GUI_LAI');
  assert.equal(reasonOf({ data: {} }), undefined);
  assert.equal(reasonOf(null), undefined);
});
