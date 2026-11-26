'use client';
import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, ConfirmDialog, Icon } from '@/components/ui';
import { SoundToggle } from '@/components/ui/SoundToggle';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import styles from './page.module.css';
import '../../../../public/speech.js';
import { fx } from '@/lib/fx';
import { PRACTICE_TYPE, label, splitBlank } from '@/lib/practice-labels.mjs';

const randomPart = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2));

function submitKeyFor(id) {
  const name = `practice-submit:${id}`;
  try {
    const existing = window.sessionStorage.getItem(name);
    if (existing) return existing;
    const key = `sub-${randomPart()}`;
    window.sessionStorage.setItem(name, key);
    return key;
  } catch {
    return `sub-${randomPart()}`;
  }
}

function playAudio(url, rate) {
  const audio = new Audio(url);
  audio.playbackRate = rate;
  return audio.play();
}

function speakText(text, rate) {
  return new Promise((resolve, reject) => {
    const speech = window.VocabSpeech;
    if (!speech?.supported()) { reject(new Error('Trình duyệt này chưa hỗ trợ giọng đọc.')); return; }
    const settings = speech.preference();
    let started = false;
    speech.speak(text, (state, message) => {
      if (state === 'speaking' && !started) { started = true; resolve(); }
      if (state === 'error') reject(new Error(message || 'Chưa phát được giọng đọc. Thử lại.'));
    }, { ...settings, rate: settings.rate * rate });
  });
}

const now = () => Date.now();

function BlankSentence({ sentence, mark = '' }) {
  const [before, after] = splitBlank(sentence);
  if (after === null) return before;
  return <>{before}<span className={styles.blank}>{mark}</span>{after}</>;
}

function ListenPrompt({ practiceId, questionId, hasAudio, tuLoai }) {
  const [error, setError] = useState('');
  const [loadingAudio, setLoadingAudio] = useState(false);
  const cached = useRef(null);
  if (!hasAudio) return <p className="notice notice-warning">Câu này chưa có âm thanh.</p>;
  const audioUrl = async () => {
    const c = cached.current;
    if (c && (!c.expiresAt || new Date(c.expiresAt).getTime() - 30000 > now())) return c;
    const file = await apiFetch(`/api/v1/practice/sessions/${practiceId}/questions/${questionId}/audio`);
    cached.current = file;
    return file;
  };
  const listen = async (rate) => {
    setError('');
    setLoadingAudio(true);
    try {
      const file = await audioUrl();
      if (file.moPhong && file.vanBanDoc) await speakText(file.vanBanDoc, rate);
      else await playAudio(file.downloadUrl, rate).catch(() => { throw new Error('Trình duyệt chưa phát được âm thanh. Thử lại hoặc kiểm tra loa.'); });
    } catch (err) {
      cached.current = null;
      setError(err.message || 'Không tải được âm thanh. Thử lại.');
    } finally {
      setLoadingAudio(false);
    }
  };
  return (
    <div className={styles.listen}>
      <div className={styles.listenBtns}>
        <button type="button" className="btn btn-primary" onClick={() => listen(1)} disabled={loadingAudio} aria-busy={loadingAudio}><Icon name="volume" />Nghe</button>
        <button type="button" className="btn btn-secondary" onClick={() => listen(0.6)} disabled={loadingAudio}>Nghe chậm</button>
      </div>
      <p className={styles.hint}>
        {tuLoai && <>Từ loại <span className="pos">{tuLoai}</span> · </>}nghe bao nhiêu lần cũng được
      </p>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

function useFocusMode(setFull) {
  useEffect(() => {
    const body = document.body;
    body.dataset.focusCount = String(Number(body.dataset.focusCount || 0) + 1);
    body.classList.add('focus-mode');
    const sync = () => setFull(!!document.fullscreenElement);
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      const left = Number(body.dataset.focusCount || 1) - 1;
      body.dataset.focusCount = String(left);
      if (left > 0) return;
      body.classList.remove('focus-mode');
      setTimeout(() => {
        if (!body.classList.contains('focus-mode') && document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      }, 0);
    };
  }, [setFull]);
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

function FullscreenIcon({ on }) {
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{on
    ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
    : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}</svg>;
}

function FocusShell({ children }) {
  const [, setFull] = useState(false);
  useFocusMode(setFull);
  return <div className="session"><main className="session-main" id="main"><div className="sheet">{children}</div></main></div>;
}

function PracticeSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const startRef = useRef(0);
  const submitKey = useRef('');
  const counterRef = useRef(null);
  const lastAnswered = useRef(0);

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['practice-session', id],
    queryFn: () => apiFetch(`/api/v1/practice/sessions/${id}`),
    enabled: !!id
  });

  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [full, setFull] = useState(false);
  const leaving = useRef(false);
  useFocusMode(setFull);

  useEffect(() => {
    startRef.current = now();
    const interval = setInterval(() => {
      setTimer(Math.floor((now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (session?.daNop) router.replace(`/luyen-tap-ket-qua?id=${id}`);
  }, [session?.daNop, id, router]);

  const submitMutation = useMutation({
    mutationFn: (body) => apiFetch(`/api/v1/practice/sessions/${id}/submissions`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      leaving.current = true;
      router.push(`/luyen-tap-ket-qua?id=${id}`);
    },
    onError: (err) => {
      if (err.status === 409) {
        router.replace(`/luyen-tap-ket-qua?id=${id}`);
        return;
      }
      setSubmitError(err.message || 'Chưa nộp được bài. Hãy thử lại, câu trả lời vẫn được giữ.');
    }
  });

  const answeredNow = session ? session.cauHoi.filter(q => {
    const ans = answers[q.id];
    if (q.loaiCau === 'GHEP_TU') return !!ans && q.deBai.cotTrai.every(l => !!ans[l.id]);
    if (q.phuongAn) return !!ans;
    return !!ans && String(ans).trim() !== '';
  }).length : 0;

  useEffect(() => {
    if (answeredNow > lastAnswered.current) {
      fx.play('select');
      fx.pop(counterRef.current);
    }
    lastAnswered.current = answeredNow;
  }, [answeredNow]);
  useEffect(() => {
    const warn = e => {
      if (leaving.current || lastAnswered.current === 0) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  if (!id) return <FocusShell><p className="notice notice-danger" role="alert">Thiếu mã bài luyện.</p></FocusShell>;
  if (error) return <FocusShell><p className="notice notice-danger" role="alert">{error.message || 'Chưa tải được bài luyện.'}</p></FocusShell>;
  if (isLoading || !session) return <FocusShell><div className="skeleton" role="status" aria-label="Đang tải bài"><div className="sk sk-title" /><div className="sk sk-row" /><div className="sk sk-row" /></div></FocusShell>;

  const handleInputChange = (questionId, value, subId = null) => {
    setAnswers(prev => {
      const next = { ...prev };
      if (subId) {
        next[questionId] = { ...(next[questionId] || {}), [subId]: value };
      } else {
        next[questionId] = value;
      }
      return next;
    });
  };

  const answeredCount = answeredNow;
  const total = session.cauHoi.length;
  const elapsed = `${Math.floor(timer / 60)}:${String(timer % 60).padStart(2, '0')}`;

  const doSubmit = () => {
    setConfirm(null);
    const traLoi = session.cauHoi.map(q => {
      if (q.loaiCau === 'GHEP_TU') {
        const cap = q.deBai.cotTrai.map(l => ({ traiId: l.id, phaiId: answers[q.id]?.[l.id] || null })).filter(c => c.phaiId);
        return { cauHoiId: q.id, cap };
      }
      if (q.phuongAn) {
        return { cauHoiId: q.id, luaChonId: answers[q.id] || null };
      }
      return { cauHoiId: q.id, noiDung: answers[q.id] || '' };
    });

    if (!submitKey.current) submitKey.current = submitKeyFor(id);
    setSubmitError('');
    submitMutation.mutate({
      submitKey: submitKey.current,
      traLoi,
      thoiGian: now() - startRef.current
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answeredCount < total) setConfirm('submit');
    else doSubmit();
  };

  const exit = () => {
    if (answeredCount > 0) setConfirm('exit');
    else { leaving.current = true; router.push('/luyen-tap'); }
  };

  const isAnswered = q => {
    const ans = answers[q.id];
    if (q.loaiCau === 'GHEP_TU') return !!ans && q.deBai.cotTrai.every(l => !!ans[l.id]);
    if (q.phuongAn) return !!ans;
    return !!ans && String(ans).trim() !== '';
  };

  const renderContent = (q) => {
    if (q.phuongAn && Array.isArray(q.phuongAn)) {
      return <>
        <div className={q.deBai?.cau ? styles.sentence : styles.prompt} lang={q.deBai?.tu ? 'en' : undefined}>
          {q.deBai?.tu || q.deBai?.nghiaVi || (q.deBai?.cau ? <BlankSentence sentence={q.deBai.cau} /> : null)}
        </div>
        <p className={styles.hint}>
          {q.deBai?.phienAm && <span className="entry-ipa">{q.deBai.phienAm}</span>}
          {q.deBai?.tuLoai && <span className="pos">{q.deBai.tuLoai}</span>}
          {q.deBai?.goiY && <span>Gợi ý: {q.deBai.goiY}</span>}
        </p>
        <div className={styles.options} role="radiogroup" aria-label={`Câu ${q.thuTu || ''}`}>
          {q.phuongAn.map((opt, i) => (
            <label key={opt.id} className={`${styles.option}${answers[q.id] === opt.id ? ` ${styles.picked}` : ''}`}>
              <input type="radio" name={q.id} value={opt.id} checked={answers[q.id] === opt.id} onChange={(e) => handleInputChange(q.id, e.target.value)} />
              <span className={styles.key}>{String.fromCharCode(65 + i)}</span>
              <span lang={q.deBai?.tu ? undefined : 'en'}>{opt.noiDung}</span>
            </label>
          ))}
        </div>
      </>;
    }

    if (q.loaiCau === 'GHEP_TU' && q.deBai?.cotTrai) {
      return (
        <div className={styles.match}>
          {q.deBai.cotTrai.map(left => (
            <div key={left.id} className={styles.matchRow}>
              <label className={styles.matchWord} htmlFor={`${q.id}-${left.id}`} lang="en">{left.noiDung}</label>
              <select
                id={`${q.id}-${left.id}`}
                className={`select${answers[q.id]?.[left.id] ? ` ${styles.selected}` : ''}`}
                value={answers[q.id]?.[left.id] || ''}
                onChange={(e) => handleInputChange(q.id, e.target.value, left.id)}
              >
                <option value="">Chọn nghĩa…</option>
                {q.deBai.cotPhai?.map(right => (
                  <option key={right.id} value={right.id}>{right.noiDung}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );
    }

    const listening = q.loaiCau === 'NGHE_VIET';
    return <>
      {listening ? (
        <ListenPrompt practiceId={id} questionId={q.id} hasAudio={!!(q.deBai?.amTuId || q.deBai?.amThanhTts)} tuLoai={q.deBai?.tuLoai} />
      ) : q.deBai?.cau ? (
        <div className={styles.sentence} lang="en"><BlankSentence sentence={q.deBai.cau} /></div>
      ) : (
        <div className={styles.prompt}>{q.deBai?.nghiaVi || q.deBai?.tu}</div>
      )}
      {!listening && (
        <p className={styles.hint}>
          <span>Gợi ý: {q.deBai?.goiY || 'gõ từ tiếng Anh chính xác'}</span>
          {q.deBai?.phienAm && <span className="entry-ipa">{q.deBai.phienAm}</span>}
          {q.deBai?.tuLoai && <span className="pos">{q.deBai.tuLoai}</span>}
          {q.deBai?.viDuVi && <span className={styles.full}>Ví dụ: {q.deBai.viDuVi}</span>}
        </p>
      )}
      <input
        className={`input ${styles.answer}`}
        type="text"
        lang="en"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label={`Câu trả lời câu ${q.thuTu || ''}`}
        placeholder={listening ? 'Từ bạn nghe được' : 'Nhập từ tiếng Anh…'}
        value={answers[q.id] || ''}
        onChange={(e) => handleInputChange(q.id, e.target.value)}
      />
    </>;
  };

  return (
    <div className="session">
      <header className="session-bar">
        <button type="button" className="btn btn-quiet btn-icon" aria-label="Thoát bài luyện" title="Thoát bài luyện" onClick={exit}><Icon name="x" /></button>
        <div className="grow">
          <p className="bar-title">Bài luyện · {label(PRACTICE_TYPE, session.loaiBai)}</p>
          <p className="bar-sub">{session.boTheTen && <span>{session.boTheTen}</span>}<span ref={counterRef}>{answeredCount} / {total} câu đã trả lời</span></p>
        </div>
        <span className={`stamp ${styles.timer}`} role="timer" aria-label={`Thời gian ${elapsed}`}><Icon name="clock" />{elapsed}</span>
        <SoundToggle />
        <ThemeToggle className="theme-session" />
        <button type="button" className="btn btn-quiet btn-icon" aria-pressed={full} aria-label={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'} title={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'} onClick={toggleFullscreen}><FullscreenIcon on={full} /></button>
      </header>
      <div className="meter is-progress session-meter" role="progressbar" aria-label="Số câu đã trả lời" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answeredCount}>
        <span style={{ '--v': total ? answeredCount / total : 0 }} />
      </div>

      <main className={`session-main ${styles.main}`} id="main">
        <nav className={styles.dots} aria-label="Chuyển nhanh tới câu">
          {session.cauHoi.map((q, i) => (
            <a key={q.id} href={`#q-${q.id}`} className={isAnswered(q) ? styles.done : undefined} aria-label={`Câu ${i + 1}${isAnswered(q) ? ', đã trả lời' : ''}`}>{i + 1}</a>
          ))}
        </nav>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <p className={styles.intro}>Trả lời theo thứ tự nào cũng được. Không phân biệt chữ hoa, chữ thường. Làm xong bấm <strong>Nộp bài</strong>.</p>

          {session.cauHoi.map((q, index) => (
            <section key={q.id} id={`q-${q.id}`} className={`sheet ${styles.question}${isAnswered(q) ? ` ${styles.answered}` : ''}`} aria-labelledby={`q-${q.id}-title`}>
              <div className={styles.qHead}>
                <span className={styles.qNo}>{index + 1}</span>
                <span id={`q-${q.id}-title`} className={styles.qType}>{label(PRACTICE_TYPE, q.loaiCau)}</span>
                {isAnswered(q) && <span className={styles.qDone}><Icon name="check" />Đã trả lời</span>}
              </div>
              {renderContent(q)}
            </section>
          ))}

          {submitError && <p className="notice notice-danger" role="alert">{submitError}</p>}

          <div className={styles.footer}>
            <div>
              <strong>{answeredCount}/{total}</strong> câu đã trả lời
              {answeredCount < total && <span className="small muted"> · còn {total - answeredCount} câu trống</span>}
            </div>
            <Button type="submit" variant="primary" size="lg" disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Đang nộp…' : 'Nộp bài'}
            </Button>
          </div>
        </form>
      </main>

      <ConfirmDialog
        isOpen={!!confirm}
        title={confirm === 'exit' ? 'Thoát bài luyện?' : 'Nộp bài khi còn câu trống?'}
        description={confirm === 'exit'
          ? `Bạn đã trả lời ${answeredCount}/${total} câu. Thoát bây giờ thì câu trả lời chưa nộp sẽ mất.`
          : `Còn ${total - answeredCount} câu trống sẽ được tính là sai.`}
        confirmLabel={confirm === 'exit' ? 'Thoát' : 'Nộp bài'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm === 'exit') { leaving.current = true; setConfirm(null); router.push('/luyen-tap'); }
          else doSubmit();
        }}
      />
    </div>
  );
}

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<FocusShell><div className="skeleton" role="status" aria-label="Đang tải"><div className="sk sk-title" /></div></FocusShell>}>
      <PracticeSessionContent />
    </Suspense>
  );
}
