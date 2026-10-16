import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../public/speech.js', import.meta.url), 'utf8');
function setup(saved = {}) {
  const storage = new Map([['vocab:speech', JSON.stringify(saved)]]);
  const available = [{voiceURI:'us',lang:'en-US',localService:true},{voiceURI:'uk',lang:'en-GB',localService:false},{voiceURI:'vi',lang:'vi-VN'}];
  const spoken = [], events = [], listeners = new Set(), timers = new Map(), polls = new Map();
  let nextTimer = 0;
  const synth = { getVoices:()=>available, cancel:()=>{}, speak:u=>spoken.push(u), addEventListener:(_,fn)=>listeners.add(fn), removeEventListener:(_,fn)=>listeners.delete(fn) };
  const window = {speechSynthesis:synth, SpeechSynthesisUtterance:class {constructor(text){this.text=text;}}, dispatchEvent:e=>events.push(e.detail.state),
    setTimeout:fn=>{timers.set(++nextTimer,fn);return nextTimer;}, clearTimeout:id=>timers.delete(id),
    setInterval:fn=>{polls.set(++nextTimer,fn);return nextTimer;}, clearInterval:id=>polls.delete(id)};
  vm.runInNewContext(source,{window,localStorage:{getItem:k=>storage.get(k)},CustomEvent:class {constructor(type,options){this.detail=options.detail;}}});
  return {api:window.VocabSpeech,available,spoken,events,storage,listeners,timers,polls};
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
  const {api,spoken,available,timers,listeners,polls}=setup();available.splice(0,2);const messages=[];
  api.speak('hello',(state,message)=>messages.push([state,message]));
  assert.equal(spoken.length,0);assert.equal(messages[0][0],'loading');
  [...timers.values()][0]();assert.equal(messages[1][0],'error');assert.ok(messages[1][1]);
  assert.equal(listeners.size,0);assert.equal(polls.size,0);
});

test('automatic selection prefers named neural voices in the requested accent and preserves explicit choices',()=>{
  const {api,spoken,available}=setup();
  available.push({voiceURI:'neural-us',name:'Jenny Natural',lang:'en-US',localService:false});
  available.push({voiceURI:'neural-uk',name:'Sonia Neural',lang:'en-GB',localService:false});
  api.speak('hospital');assert.equal(spoken[0].voice.voiceURI,'neural-us');assert.equal(spoken[0].rate,1);
  api.speak('hospital',()=>{},{accent:'en-GB'});assert.equal(spoken[1].voice.voiceURI,'neural-uk');
  api.speak('hospital',()=>{},{voice:'us',accent:'en-GB'});assert.equal(spoken[2].voice.voiceURI,'us');
});

test('late voices start once and release polling and listeners',()=>{
  const {api,spoken,available,listeners,timers,polls}=setup();available.length=0;const states=[];
  api.speak('hello',state=>states.push(state));
  available.push({voiceURI:'late',lang:'en_US',localService:true});
  [...listeners][0]();assert.equal(spoken.length,1);assert.equal(spoken[0].voice.voiceURI,'late');
  assert.deepEqual(states,['loading','speaking']);assert.equal(listeners.size,0);assert.equal(timers.size,0);assert.equal(polls.size,0);
});

test('canceling a pending reader prevents late voices from speaking',()=>{
  const {api,spoken,available,listeners,timers,polls}=setup();available.length=0;const states=[];
  const cancel=api.speak('hello',state=>states.push(state));const late=[...listeners][0];cancel();
  available.push({voiceURI:'late',lang:'en-US'});late();
  assert.equal(spoken.length,0);assert.deepEqual(states,['loading','idle']);
  assert.equal(listeners.size,0);assert.equal(timers.size,0);assert.equal(polls.size,0);
});

test('normalizes preferences, deduplicates voices and falls back to another English accent',()=>{
  const {api,spoken,available}=setup({rate:'bad',accent:'invalid'});
  available.push({...available[0]});assert.equal(api.voices().length,2);
  assert.equal(api.preference().rate,1);assert.equal(api.preference().accent,'en-US');
  api.speak('hello',()=>{},{accent:'en-AU',rate:20});assert.equal(spoken[0].voice.voiceURI,'us');assert.equal(spoken[0].rate,1.25);
});
