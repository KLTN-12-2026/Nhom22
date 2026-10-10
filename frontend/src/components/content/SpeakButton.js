'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Icon } from '@/components/ui';

const subscribe = () => () => {};
const supported = () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const serverSupported = () => false;

export function SpeakButton({ text, sentence = false }) {
  const available = useSyncExternalStore(subscribe, supported, serverSupported);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const current = useRef(null);
  useEffect(() => () => {
    if (current.current) {
      current.current.onend = null;
      current.current.onerror = null;
      window.speechSynthesis.cancel();
    }
  }, []);
  const speak = () => {
    const synth = window.speechSynthesis;
    if (speaking) { synth.cancel(); setSpeaking(false); current.current = null; return; }
    setError('');
    const voices = synth.getVoices().filter(voice => /^en(?:-|_)/i.test(voice.lang));
    if (!voices.length) { setError('Chưa tìm thấy giọng tiếng Anh. Hãy bật giọng tiếng Anh trong cài đặt thiết bị hoặc dùng tệp âm thanh.'); return; }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text.trim());
    utterance.voice = voices.find(voice => voice.lang.toLowerCase() === 'en-us' && voice.localService) || voices.find(voice => voice.localService) || voices[0];
    utterance.lang = utterance.voice.lang;
    utterance.rate = 0.85;
    utterance.onend = () => { if (current.current === utterance) { setSpeaking(false); current.current = null; } };
    utterance.onerror = event => {
      if (current.current !== utterance) return;
      setSpeaking(false);
      current.current = null;
      if (!['canceled', 'interrupted'].includes(event.error)) setError('Chưa phát được giọng đọc. Bạn có thể thử lại hoặc dùng tệp âm thanh.');
    };
    current.current = utterance;
    setSpeaking(true);
    synth.speak(utterance);
  };
  return <div className="browser-speech">
    <button type="button" className="btn btn-media btn-sm" disabled={!available || !text?.trim()} aria-pressed={speaking} onClick={speak}><Icon name="volume" />{speaking ? 'Dừng đọc' : sentence ? 'Đọc câu bằng trình duyệt' : 'Đọc từ bằng trình duyệt'}</button>
    {!available && <p className="muted">Trình duyệt này chưa hỗ trợ giọng đọc.</p>}
    {error && <p className="field-error" role="alert">{error}</p>}
  </div>;
}
