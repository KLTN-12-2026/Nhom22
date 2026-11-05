'use client';
import { useEffect, useRef } from 'react';
import '../../../public/speech.js';
export function SpeechSettings() {
  const host = useRef(null);
  useEffect(() => window.VocabSpeech.mountSettings(host.current), []);
  return <section className="speech-settings" ref={host} aria-label="Giọng đọc tiếng Anh" />;
}
