(function () {
  'use strict';
  if (typeof window === 'undefined' || window.VocabSpeech) return;
  const key = 'vocab:speech';
  let active = null;
  const supported = () => !!(window.speechSynthesis && window.SpeechSynthesisUtterance);
  const language = value => String(value || '').replaceAll('_', '-').toLowerCase();
  const accents = ['', 'en-US', 'en-GB', 'en-AU', 'en-CA'];
  const rateValue = value => Number.isFinite(Number(value)) && Number(value) > 0 ? Math.max(0.5, Math.min(1.25, Number(value))) : 1;
  const quality = voice => /natural|neural/i.test(voice.name || '') ? 3 : /google/i.test(voice.name || '') ? 2 : voice.default ? 1 : 0;
  const voices = () => supported() ? window.speechSynthesis.getVoices().filter(v => /^en(?:[-_]|$)/i.test(v.lang))
    .filter((v, index, list) => list.findIndex(other => other.voiceURI === v.voiceURI && language(other.lang) === language(v.lang)) === index)
    .sort((a, b) => quality(b) - quality(a) || language(a.lang).localeCompare(language(b.lang)) || String(a.name || '').localeCompare(String(b.name || ''))) : [];
  function settingsValue(value = {}) {
    return { voice: typeof value?.voice === 'string' ? value.voice : '', accent: accents.includes(value?.accent) ? value.accent : 'en-US', rate: rateValue(value?.rate) };
  }
  function preference() {
    try { return settingsValue(JSON.parse(localStorage.getItem(key) || '{}')); }
    catch { return settingsValue(); }
  }
  function save(value) { localStorage.setItem(key, JSON.stringify(settingsValue(value))); }
  function chooseVoice(available, settings) {
    return available.find(v => v.voiceURI === settings.voice)
      || available.find(v => language(v.lang) === language(settings.accent))
      || available.find(v => language(v.lang) === 'en-us') || available[0];
  }
  const feedback = state => window.dispatchEvent(new CustomEvent('vocab:mascot', { detail: { state } }));
  function stop() {
    if (!active) return;
    const previous = active; active = null;
    previous.cleanup();
    if (previous.utterance) {
      previous.utterance.onstart = previous.utterance.onend = previous.utterance.onerror = null;
      window.speechSynthesis.cancel();
    }
    feedback('quiet'); previous.status('idle');
  }
  function speak(text, status = () => {}, settings = preference()) {
    if (!supported()) { status('error', 'Trình duyệt này chưa hỗ trợ giọng đọc.'); return () => {}; }
    if (!text?.trim()) return () => {};
    stop();
    const selected = settingsValue(settings);
    const entry = { utterance: null, status, cleanup: () => {} }; active = entry;
    const finish = error => { if (active !== entry) return; entry.cleanup(); active = null; feedback('quiet'); status(error ? 'error' : 'idle', error); };
    function start() {
      if (active !== entry || entry.utterance) return;
      const voice = chooseVoice(voices(), selected);
      if (!voice) return;
      entry.cleanup();
      const utterance = new window.SpeechSynthesisUtterance(text.trim()); entry.utterance = utterance;
      utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = selected.rate;
      status('speaking');
      utterance.onstart = () => { if (active === entry) feedback('speaking'); };
      utterance.onend = () => finish();
      utterance.onerror = event => finish(['canceled', 'interrupted'].includes(event.error) ? '' : event.error === 'network' ? 'Giọng trực tuyến mất kết nối. Hãy thử lại hoặc chọn giọng trên thiết bị.' : 'Chưa phát được giọng đọc. Hãy thử lại hoặc chọn giọng khác.');
      try { window.speechSynthesis.speak(utterance); } catch { finish('Chưa phát được giọng đọc. Hãy thử lại.'); }
    }
    if (voices().length) start();
    else {
      status('loading');
      const timer = window.setTimeout(() => finish('Chưa có giọng tiếng Anh. Hãy thêm giọng trong cài đặt thiết bị rồi thử lại.'), 8000);
      const poll = window.setInterval(start, 250);
      entry.cleanup = () => { window.clearTimeout(timer); window.clearInterval(poll); window.speechSynthesis.removeEventListener('voiceschanged', start); };
      window.speechSynthesis.addEventListener('voiceschanged', start);
      start();
    }
    return () => { if (active === entry) stop(); };
  }
  function mountSettings(host) {
    host.innerHTML = '<h2>Giọng đọc tiếng Anh</h2><p class="field-hint">Ưu tiên giọng Natural/Neural nếu có. Giọng và chất lượng phụ thuộc trình duyệt, thiết bị; giọng trực tuyến cần kết nối mạng. Thiết lập lưu trên trình duyệt này.</p><label class="field-label">Giọng vùng<select class="select" data-speech-accent><option value="en-US">Anh-Mỹ</option><option value="en-GB">Anh-Anh</option><option value="en-AU">Anh-Úc</option><option value="en-CA">Anh-Canada</option><option value="">Tất cả giọng tiếng Anh</option></select></label><label class="field-label">Giọng đọc<select class="select" data-speech-voice></select></label><label class="field-label">Tốc độ đọc<select class="select" data-speech-rate><option value="0.65">Chậm · 0,65×</option><option value="0.85">Vừa · 0,85×</option><option value="1">Tự nhiên · 1×</option><option value="1.15">Nhanh · 1,15×</option></select></label><div class="row"><button class="btn btn-media" type="button" data-speech-test>Nghe thử</button><button class="btn btn-primary" type="button" data-speech-save>Lưu giọng đọc</button></div><p class="field-hint" role="status" data-speech-status></p>';
    const select = host.querySelector('[data-speech-voice]'), rate = host.querySelector('[data-speech-rate]'), message = host.querySelector('[data-speech-status]'), test = host.querySelector('[data-speech-test]');
    const accent = host.querySelector('[data-speech-accent]');
    const saved = preference(); accent.value = saved.accent;
    const previousVoice = voices().find(v => v.voiceURI === saved.voice);
    if (previousVoice && language(previousVoice.lang) !== language(saved.accent)) accent.value = '';
    rate.value = String(saved.rate);
    if (!rate.value) { rate.appendChild(new Option(`${saved.rate}×`, String(saved.rate))); rate.value = String(saved.rate); }
    let initialVoice = saved.voice;
    function refresh() {
      const current = select.value || initialVoice; select.replaceChildren(new Option('Tự động chọn giọng tiếng Anh', ''));
      const all = voices();
      const restored = all.find(v => v.voiceURI === initialVoice);
      if (restored && accent.value && language(restored.lang) !== language(accent.value)) accent.value = '';
      const available = all.filter(v => !accent.value || language(v.lang) === language(accent.value));
      available.forEach(v => select.appendChild(new Option(`${v.name} · ${v.lang} · ${v.localService ? 'Trên thiết bị' : 'Trực tuyến'}`, v.voiceURI)));
      if (available.some(v => v.voiceURI === current)) select.value = current;
      if (all.length) initialVoice = '';
      select.disabled = !available.length; test.disabled = !supported();
      message.textContent = !supported() ? 'Trình duyệt này chưa hỗ trợ giọng đọc.' : !all.length ? 'Đang tìm giọng tiếng Anh. Nếu danh sách trống, hãy thêm giọng trong cài đặt thiết bị.' : !available.length ? 'Chưa có giọng vùng này. Chế độ tự động sẽ dùng giọng tiếng Anh khác có sẵn.' : `${available.length} giọng có sẵn. Chọn một giọng và nghe thử để so sánh.`;
    }
    let cancel = () => {};
    host.querySelector('[data-speech-save]').onclick = () => {
      try { save({ voice: select.value, accent: accent.value, rate: Number(rate.value) }); message.textContent = 'Đã lưu giọng đọc trên trình duyệt này.'; feedback('success'); }
      catch { message.textContent = 'Trình duyệt đang chặn lưu thiết lập.'; }
    };
    test.onclick = () => {
      cancel();
      cancel = speak('Every small step makes a difference. The doctor works at the hospital.', (state, error) => { message.textContent = error || (state === 'loading' ? 'Đang tải giọng đọc…' : state === 'speaking' ? 'Đang đọc câu mẫu…' : ''); }, { voice: select.value, accent: accent.value, rate: Number(rate.value) });
    };
    accent.onchange = () => { initialVoice = ''; select.value = ''; refresh(); };
    refresh();
    window.speechSynthesis?.addEventListener('voiceschanged', refresh);
    return () => { cancel(); window.speechSynthesis?.removeEventListener('voiceschanged', refresh); };
  }
  window.VocabSpeech = { supported, voices, preference, speak, stop, mountSettings };
})();
