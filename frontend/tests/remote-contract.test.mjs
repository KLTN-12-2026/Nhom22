import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pcmWav, aiPending, draftCommit, dateTime, localDate } from '../src/lib/remote-contract.mjs';
test('WAV matches backend PCM mono 16kHz/16bit contract with resampling and clipping', () => {
  const bytes=pcmWav(new Float32Array(48000).fill(2),48000), view=new DataView(bytes);
  assert.equal(bytes.byteLength,32044);
  assert.equal(new TextDecoder().decode(bytes.slice(0,4)),'RIFF');
  assert.equal(new TextDecoder().decode(bytes.slice(8,12)),'WAVE');
  assert.equal(view.getUint16(20,true),1); assert.equal(view.getUint16(22,true),1);
  assert.equal(view.getUint32(24,true),16000);assert.equal(view.getUint32(28,true),32000);
  assert.equal(view.getUint16(34,true),16);assert.equal(view.getUint32(40,true),32000);
  assert.equal(view.getInt16(44,true),32767);
  assert.throws(()=>pcmWav(new Float32Array(),48000));
});
test('AI polls pending jobs only; terminal failure never becomes a fabricated success', () => {
  for(const s of ['CHO','DANG_XU_LY'])assert.equal(aiPending(s),true);
  for(const s of ['HOAN_TAT','LOI','KHONG_XAC_DINH',undefined])assert.equal(aiPending(s),false);
});
test('draft commit contains only selected edited rows and preserves backend IDs', () => {
  const rows=[{id:'123',word:' receipt ',meaning:' biên lai ',part:'noun',sentence:'Keep it.',selected:true},{id:'124',word:'omit',meaning:'bỏ',selected:false}];
  const result=draftCommit(rows,'42');
  assert.deepEqual(result.banNhapIds,['123']);assert.equal(result.boTheId,'42');
  assert.equal(result.sua[0].tu,'receipt');assert.equal(result.sua[0].nghiaVi,'biên lai');
  assert.equal(rows[0].word,' receipt ');
  assert.throws(()=>draftCommit(rows,''));assert.throws(()=>draftCommit([],'42'));
});
test('remote dates use Vietnam boundary and display missing instants honestly',()=>{
 assert.equal(localDate('2026-11-17T23:00:00Z'),'2026-11-18');assert.equal(dateTime(null),'—');
});
