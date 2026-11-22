import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REALTIME_KEYS, handledId, incidentMessage, keysFor, parseEvent } from '../src/lib/realtime.mjs';

test('every backend event type has a mapping', () => {
  const types = ['THONG_BAO_MOI', 'THONG_BAO_HE_THONG', 'TAI_KHOAN_BI_KHOA', 'GOI_THAY_DOI', 'THANH_TOAN', 'YEU_CAU_AI', 'HANG_CHO_QUAN_TRI', 'MUC_DA_XU_LY', 'SU_CO_HE_THONG', 'PHIEN_HOC_MOI'];
  assert.deepEqual(Object.keys(REALTIME_KEYS).sort(), types.sort());
});

test('parseEvent reads loai and id and survives bad data', () => {
  assert.deepEqual(parseEvent('{"loai":"YEU_CAU_AI","id":"7"}'), { loai: 'YEU_CAU_AI', id: '7' });
  assert.deepEqual(parseEvent('{"loai":"THONG_BAO_MOI","id":""}'), { loai: 'THONG_BAO_MOI', id: null });
  assert.deepEqual(parseEvent('not json'), { loai: '', id: null });
});

test('keysFor targets the queries each event changes', () => {
  assert.deepEqual(keysFor('YEU_CAU_AI', '7')[0], ['ai-request', '7']);
  assert.ok(keysFor('HANG_CHO_QUAN_TRI').some(key => key[0] === 'admin-queue'));
  assert.deepEqual(keysFor('UNKNOWN'), []);
  assert.deepEqual(keysFor('TAI_KHOAN_BI_KHOA'), []);
});

test('incidentMessage describes component state and job failures', () => {
  assert.deepEqual(incidentMessage('REDIS:DOWN'), { text: 'Redis không phản hồi', bad: true });
  assert.equal(incidentMessage('CSDL:UP').bad, false);
  assert.equal(incidentMessage('TAC_VU:12').bad, true);
  assert.equal(incidentMessage('KHAC:DOWN'), null);
});

test('handledId extracts the id only for the matching kind', () => {
  assert.equal(handledId('BAO_CAO:7', 'BAO_CAO'), '7');
  assert.equal(handledId('CONG_KHAI:7', 'BAO_CAO'), null);
  assert.equal(handledId(null, 'BAO_CAO'), null);
});
