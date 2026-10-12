import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../public/speech.js', import.meta.url), 'utf8');
function setup(saved = {}) {
  const storage = new Map([['vocab:speech', JSON.stringify(saved)]]);
  const available = [{voiceURI:'us',lang:'en-US',localService:true},{voiceURI:'uk',lang:'en-GB',localService:false},{voiceURI:'vi',lang:'vi-VN'}];
  const spoken = [], events = [];
  const synth = { getVoices:()=>available, cancel:()=>{}, speak:u=>spoken.push(u) };
  const window = {speechSynthesis:synth, SpeechSynthesisUtterance:class {constructor(text){this.text=text;}}, dispatchEvent:e=>events.push(e.detail.state)};
  vm.runInNewContext(source,{window,localStorage:{getItem:k=>storage.get(k)},CustomEvent:class {constructor(type,options){this.detail=options.detail;}}});
  return {api:window.VocabSpeech,available,spoken,events,storage};
}
test('uses the saved English voice and rate, with a fallback for a missing voice',()=>{
  const {api,spoken,available}=setup({voice:'uk',rate:1.15});
  api.speak(' hello '); assert.equal(spoken[0].voice.voiceURI,'uk'); assert.equal(spoken[0].rate,1.15); assert.equal(spoken[0].text,'hello');
  available.splice(1,1); api.speak('again'); assert.equal(spoken[1].voice.voiceURI,'us');
});
test('switching readers releases the previous control and stale cleanup cannot cancel the new reader',()=>{
  const {api,spoken,events}=setup(); const first=[], second=[];
  const stopFirst=api.speak('one',state=>first.push(state));spoken[0].onstart();
  api.speak('two',state=>second.push(state));stopFirst();
  assert.deepEqual(first,['speaking','idle']); assert.deepEqual(second,['speaking']);
  assert.equal(spoken[0].onend,null);spoken[1].onstart();spoken[1].onend();
  assert.deepEqual(second,['speaking','idle']);assert.deepEqual(events,['speaking','quiet','speaking','quiet']);
});
test('preview uses the draft voice without changing saved preferences',()=>{
  const {api,spoken,storage}=setup({voice:'us',rate:0.85});
  const before=storage.get('vocab:speech');api.speak('sample',()=>{}, {voice:'uk',rate:0.65});
  assert.equal(spoken[0].voice.voiceURI,'uk');assert.equal(spoken[0].rate,0.65);assert.equal(storage.get('vocab:speech'),before);
});
test('missing English voices report a recoverable error and do not start speech',()=>{
  const {api,spoken,available}=setup();available.splice(0,2);const messages=[];
  api.speak('hello',(state,message)=>messages.push([state,message]));
  assert.equal(spoken.length,0);assert.equal(messages[0][0],'error');assert.ok(messages[0][1]);
});
