import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../src/lib/api-client.js', import.meta.url), 'utf8');
const { ApiError } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);

test('library failures expose the backend requestId for support', () => {
  const error = new ApiError(404, { code: 'NOT_FOUND', message: 'Không tìm thấy bộ thẻ', fieldErrors: [], requestId: 'library-request' });
  assert.equal(error.traceId, 'library-request');
  assert.match(error.message, /library-request/);
});
