'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Icon } from '@/components/ui';
import '../../../public/speech.js';
const subscribe = () => () => {};
const supported = () => window.VocabSpeech.supported();
const serverSupported = () => false;
export function SpeakButton({ text, sentence = false }) {
  const available = useSyncExternalStore(subscribe, supported, serverSupported);
  const [speaking, setSpeaking] = useState(false);
  const [error, setError] = useState('');
  const cancel = useRef(() => {});
  useEffect(() => () => cancel.current(), [text]);
  const speak = () => {
    if (speaking) { cancel.current(); return; }
    setError('');
    cancel.current = window.VocabSpeech.speak(text, (state, message) => {
      setSpeaking(state === 'speaking' || state === 'loading'); setError(message || '');
    });
  };
  return <div className="browser-speech">
    <button type="button" className="btn btn-media btn-sm" disabled={!available || !text?.trim()} aria-pressed={speaking} onClick={speak}><Icon name="volume" />{speaking ? 'Dừng đọc' : sentence ? 'Đọc câu ví dụ' : 'Đọc từ'}</button>
    {!available && <p className="muted">Trình duyệt này chưa hỗ trợ giọng đọc.</p>}
    {error && <p className="field-error" role="alert">{error}</p>}
  </div>;
}
