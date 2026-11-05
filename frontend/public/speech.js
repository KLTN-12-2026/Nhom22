(function () {
  'use strict';
  if (typeof window === 'undefined' || window.VocabSpeech) return;
  const key = 'vocab:speech';
  let active = null;
  const supported = () => !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  const voices = () => supported() ? window.speechSynthesis.getVoices().filter(v => /^en(?:[-_]|$)/i.test(v.lang)) : [];
  function preference() {
    try { const value = JSON.parse(localStorage.getItem(key) || '{}'); return { voice: typeof value?.voice === 'string' ? value.voice : '', rate: Math.max(0.5, Math.min(1.25, Number(value?.rate) || 0.85)) }; }
    catch { return { voice: '', rate: 0.85 }; }
  }
  function save(value) { localStorage.setItem(key, JSON.stringify(value)); }
  const feedback = state => window.dispatchEvent(new CustomEvent('vocab:mascot', { detail: { state } }));
  function stop() {
    if (!active) return;
    const previous = active; active = null;
    previous.utterance.onstart = previous.utterance.onend = previous.utterance.onerror = null;
    window.speechSynthesis.cancel(); feedback('quiet'); previous.status('idle');
  }
  function speak(text, status = () => {}, settings = preference()) {
    if (!supported()) { status('error', 'Trình duyệt này chưa hỗ trợ giọng đọc.'); return () => {}; }
    if (!text?.trim()) return () => {};
    const available = voices();
    const voice = available.find(v => v.voiceURI === settings.voice) || available.find(v => v.lang.toLowerCase() === 'en-us' && v.localService) || available[0];
    if (!voice) { status('error', 'Chưa có giọng tiếng Anh. Hãy thêm giọng trong cài đặt thiết bị rồi thử lại.'); return () => {}; }
    stop();
    const utterance = new window.SpeechSynthesisUtterance(text.trim());
    const entry = { utterance, status }; active = entry;
    utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = settings.rate;
    status('speaking');
    utterance.onstart = () => { if (active === entry) feedback('speaking'); };
    const finish = error => { if (active !== entry) return; active = null; feedback('quiet'); status(error ? 'error' : 'idle', error); };
    utterance.onend = () => finish();
    utterance.onerror = event => finish(['canceled', 'interrupted'].includes(event.error) ? '' : 'Chưa phát được giọng đọc. Hãy thử lại.');
    try { window.speechSynthesis.speak(utterance); } catch { finish('Chưa phát được giọng đọc. Hãy thử lại.'); }
    return () => { if (active === entry) stop(); };
  }
  function mountSettings(host) {
    host.innerHTML = '<h2>Giọng đọc tiếng Anh</h2><p class="field-hint">Lưu trên trình duyệt này. Các giọng có sẵn tùy thiết bị.</p><label class="field-label">Giọng đọc<select class="select" data-speech-voice></select></label><label class="field-label">Tốc độ đọc<select class="select" data-speech-rate><option value="0.65">Chậm · 0,65×</option><option value="0.85">Vừa · 0,85×</option><option value="1">Tự nhiên · 1×</option><option value="1.15">Nhanh · 1,15×</option></select></label><div class="row"><button class="btn btn-media" type="button" data-speech-test>Nghe thử</button><button class="btn btn-primary" type="button" data-speech-save>Lưu giọng đọc</button></div><p class="field-hint" role="status" data-speech-status></p>';
    const select = host.querySelector('[data-speech-voice]'), rate = host.querySelector('[data-speech-rate]'), message = host.querySelector('[data-speech-status]'), test = host.querySelector('[data-speech-test]');
    const saved = preference(); rate.value = String(saved.rate); if (!rate.value) rate.value = '0.85';
    function refresh() {
      const current = select.value || saved.voice; select.replaceChildren(new Option('Tự động chọn giọng tiếng Anh', ''));
      const available = voices();
      available.forEach(v => select.appendChild(new Option(`${v.name} · ${v.lang}`, v.voiceURI)));
      if (available.some(v => v.voiceURI === current)) select.value = current;
      select.disabled = test.disabled = !available.length;
      message.textContent = !supported() ? 'Trình duyệt này chưa hỗ trợ giọng đọc.' : !available.length ? 'Đang tìm giọng tiếng Anh. Nếu danh sách trống, hãy thêm giọng trong cài đặt thiết bị.' : saved.voice && !available.some(v => v.voiceURI === saved.voice) ? 'Giọng đã lưu không có trên thiết bị này; sẽ dùng giọng tự động.' : '';
    }
    let cancel = () => {};
    host.querySelector('[data-speech-save]').onclick = () => {
      try { save({ voice: select.value, rate: Number(rate.value) }); message.textContent = 'Đã lưu giọng đọc trên trình duyệt này.'; feedback('success'); }
      catch { message.textContent = 'Trình duyệt đang chặn lưu thiết lập.'; }
    };
    test.onclick = () => {
      cancel();
      cancel = speak('Every small step makes a difference.', (state, error) => { message.textContent = error || (state === 'speaking' ? 'Đang đọc câu mẫu…' : ''); }, { voice: select.value, rate: Number(rate.value) });
    };
    refresh();
    window.speechSynthesis?.addEventListener('voiceschanged', refresh);
    return () => { cancel(); window.speechSynthesis?.removeEventListener('voiceschanged', refresh); };
  }
  window.VocabSpeech = { supported, voices, preference, speak, stop, mountSettings };
})();
