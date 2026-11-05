'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui';
import styles from './page.module.css';

const WORDS = [
  { value: 'receipt', label: 'receipt — biên lai', ipa: '/rɪˈsiːt/' },
  { value: 'schedule', label: 'schedule — lịch trình', ipa: '/ˈskedʒuːl/' },
  { value: 'appointment', label: 'appointment — cuộc hẹn', ipa: '/əˈpɔɪntmənt/' },
];

export default function PronunciationPage() {
  const [word, setWord] = useState(WORDS[0].value);
  const [recordingState, setRecordingState] = useState('idle');
  const [audioUrl, setAudioUrl] = useState('');
  const [assessment, setAssessment] = useState(null);
  const [message, setMessage] = useState('');
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const selectedWord = WORDS.find(item => item.value === word) || WORDS[0];

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const speak = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(word));
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessage('Trình duyệt hoặc thiết bị chưa hỗ trợ ghi âm.');
      return;
    }
    try {
      setMessage('');
      setAssessment(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl('');
      chunksRef.current = [];
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(streamRef.current);
      recorderRef.current = recorder;
      recorder.ondataavailable = event => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        setAudioUrl(URL.createObjectURL(blob));
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        setRecordingState('recorded');
        setMessage('Đã ghi âm. Hãy nghe lại trước khi gửi đánh giá.');
      };
      recorder.start();
      setRecordingState('recording');
      setMessage('Đang ghi âm… tối đa 15 giây.');
    } catch {
      streamRef.current?.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setMessage('Không thể truy cập micro. Hãy kiểm tra quyền sử dụng micro rồi thử lại.');
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl('');
    setAssessment(null);
    setMessage('Chưa ghi âm · tối đa 15 giây');
    setRecordingState('idle');
  };

  const assessRecording = () => {
    setAssessment({ score: 86, pronunciation: 'Khá rõ', rhythm: 'Ổn định', tip: 'Nhấn rõ âm đầu và giữ nguyên trọng âm ở âm tiết thứ hai.' });
    setMessage('Đã có đánh giá mẫu. Đây là phản hồi tham khảo, chưa gửi bản ghi lên máy chủ.');
  };

  return (
    <div className={`page ${styles.page}`}>
      <div className={styles.demoBar}>
        <span>Bản trải nghiệm · Dữ liệu mô phỏng</span>
        <Link href="/ai-lich-su">Lịch sử AI</Link>
      </div>
      <article className="sheet" aria-labelledby="page-title">
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link href="/hom-nay">Hôm nay</Link><span aria-hidden="true">/</span><span>Góc phát âm</span>
        </nav>
        <div className="form-head">
          <div className="form-code"><span>Học và mở rộng</span><span>UI33 · Đợt 3</span></div>
          <h1 id="page-title">Góc phát âm</h1>
          <p>Nghe, ghi ngắn và xem lại trước khi gửi đánh giá.</p>
        </div>
        <p className={styles.status} role="status" aria-live="polite">{message}</p>
        <div className={styles.workspace}>
          <section className={styles.recordPanel} aria-labelledby="record-title">
            <div className="field">
              <label className="field-label" htmlFor="pron-word">Từ muốn luyện</label>
              <select className="select" id="pron-word" value={word} onChange={event => { setWord(event.target.value); resetRecording(); }}>
                {WORDS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className={styles.wordCard}>
              <span className="caption">Từ mục tiêu</span>
              <h2 id="record-title" className="word" lang="en">{selectedWord.value}</h2>
              <p className="ipa">{selectedWord.ipa}</p>
              <button className="btn btn-media" type="button" onClick={speak}><Icon name="volume" />Nghe mẫu bằng giọng trình duyệt</button>
            </div>
            <p className="small muted">{recordingState === 'recording' ? 'Đang thu âm…' : recordingState === 'recorded' ? 'Đã có bản ghi trong tab này.' : 'Chưa ghi âm · tối đa 15 giây'}</p>
            <div className={styles.actions}>
              <button className="btn btn-primary" type="button" onClick={startRecording} disabled={recordingState === 'recording'}><Icon name="mic" />Bắt đầu ghi âm</button>
              <button className="btn btn-danger" type="button" onClick={stopRecording} disabled={recordingState !== 'recording'}>Dừng ghi</button>
              <button className="btn btn-secondary" type="button" onClick={resetRecording} disabled={recordingState === 'idle'}>Ghi lại</button>
            </div>
            {audioUrl && <audio className={styles.audio} src={audioUrl} controls aria-label="Phát lại bản ghi của bạn" />}
            <button className="btn btn-primary" type="button" onClick={assessRecording} disabled={!audioUrl}>Chuẩn bị gửi bản ghi</button>
            <p className="small muted">Micro chỉ được yêu cầu khi bấm ghi. Bản ghi được giữ trong tab này, chưa tải lên máy chủ.</p>
          </section>
          <section className={styles.output} aria-live="polite">
            {!assessment ? (
              <div className="empty"><h2>Phản hồi phát âm</h2><p>Chỉ hiện chỉ số dịch vụ trả về; chỉ số thiếu hiển thị “Chưa có”.</p></div>
            ) : (
              <div className={styles.assessment}>
                <span className="caption">Đánh giá mẫu</span>
                <strong className={styles.score}>{assessment.score}<small>/100</small></strong>
                <div className={styles.metrics}><p><span>Độ rõ</span><strong>{assessment.pronunciation}</strong></p><p><span>Nhịp điệu</span><strong>{assessment.rhythm}</strong></p></div>
                <div className="notice notice-info"><Icon name="info" /><span>{assessment.tip}</span></div>
                <p className="small muted">Kết quả mô phỏng để kiểm tra giao diện. Muốn đánh giá thật cần dịch vụ phát âm phía máy chủ.</p>
              </div>
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
