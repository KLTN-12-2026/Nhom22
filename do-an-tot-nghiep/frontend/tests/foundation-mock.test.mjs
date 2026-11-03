import test from 'node:test';
import assert from 'node:assert/strict';
import { setupServer } from 'msw/node';
import { handlers } from '../src/mocks/foundation-handlers.mjs';

test('foundation MSW ping follows the real status and serverTime contract', async () => {
  const server = setupServer(...handlers);
  server.listen({ onUnhandledRequest: 'error' });
  try {
    const response = await fetch('http://vocab.test/api/v1/public/ping');
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.status, 'UP');
    assert.ok(Number.isFinite(Date.parse(body.serverTime)));
    assert.deepEqual(Object.keys(body).sort(), ['serverTime', 'status']);
  } finally { server.close(); }
});
