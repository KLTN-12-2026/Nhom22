import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dot2MockEnabled, isDot2Route, NO_ROUTE_MESSAGE, shouldUseMock } from '../src/lib/dot2-mock.mjs';
import { splitBlank } from '../src/lib/practice-labels.mjs';

test('Đợt 2 mock flag defaults to development only and honours explicit values', () => {
  assert.equal(dot2MockEnabled(undefined, 'development'), true);
  assert.equal(dot2MockEnabled(undefined, 'production'), false);
  assert.equal(dot2MockEnabled('enabled', 'production'), true);
  assert.equal(dot2MockEnabled('disabled', 'development'), false);
});

test('Đợt 2 routes cover practice, notebook and statistics pages only', () => {
  ['/luyen-tap', '/luyen-tap-lam-bai', '/luyen-tap-ket-qua', '/luyen-tap-lich-su', '/so-tay', '/thong-ke'].forEach(path => assert.equal(isDot2Route(path), true, path));
  ['/hom-nay', '/hoc', '/bo-the', '/luyen-tapx', '/thong-ke-tuan'].forEach(path => assert.equal(isDot2Route(path), false, path));
});

test('mock fallback only replaces missing routes and unavailable backends', () => {
  assert.equal(shouldUseMock(404, null), true);
  assert.equal(shouldUseMock(404, { code: 'NOT_FOUND', message: NO_ROUTE_MESSAGE }), true);
  assert.equal(shouldUseMock(404, { code: 'NOT_FOUND', message: 'Không tìm thấy bộ thẻ' }), false);
  [405, 501, 502, 503].forEach(status => assert.equal(shouldUseMock(status, null), true, String(status)));
  [200, 201, 204, 400, 401, 403, 409, 422, 429, 500].forEach(status => assert.equal(shouldUseMock(status, { code: 'X' }), false, String(status)));
});

test('blank sentences split around the placeholder without HTML', () => {
  assert.deepEqual(splitBlank('Sign the _____ today.'), ['Sign the ', ' today.']);
  assert.deepEqual(splitBlank('<b>no blank</b>'), ['<b>no blank</b>', null]);
  assert.deepEqual(splitBlank(null), ['', null]);
});
