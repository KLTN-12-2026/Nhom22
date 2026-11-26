'use client';
import { useState, Suspense, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
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

const HINI_TIME_LIMIT = 20;
const HINI_LABELS = ['A', 'B', 'C', 'D'];

const sameWord = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

function checkAnswer(practiceId, questionId, body) {
  return apiFetch(`/api/v1/practice/sessions/${practiceId}/questions/${questionId}/check`, {
    method: 'POST',
    body: JSON.stringify(body)
  });
}

let audioCtx = null;
function getAudioCtx() {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(freq, type, duration, vol = 0.1) {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

const SFX = {
  correct: () => {
    playTone(600, 'sine', 0.1);
    setTimeout(() => playTone(800, 'sine', 0.2), 100);
  },
  wrong: () => {
    playTone(300, 'square', 0.15, 0.05);
    setTimeout(() => playTone(200, 'square', 0.2, 0.05), 150);
  },
  tick: () => {
    playTone(1000, 'sine', 0.05, 0.02);
  },
  timeup: () => {
    playTone(150, 'sawtooth', 0.4, 0.1);
    setTimeout(() => playTone(100, 'sawtooth', 0.4, 0.1), 200);
  },
  select: () => {
    playTone(400, 'sine', 0.1, 0.05);
  }
};

function speak(text) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window && text) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } catch {}
  }
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function HiniGameView({ session, id }) {
  const router = useRouter();
  const startRef = useRef(0);
  const submitKey = useRef('');

  const [activeQuestions, setActiveQuestions] = useState(session.cauHoi || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState({});
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(HINI_TIME_LIMIT);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    startRef.current = now();
  }, []);

  const revealed = useRef({});

  const questionOptionsMap = useMemo(() => {
    const map = {};
    (session?.cauHoi || []).forEach(q => {
      if (Array.isArray(q.phuongAn) && q.phuongAn.length > 0) map[q.id] = q.phuongAn;
      else map[q.id] = (q.deBai?.phuongAnTu || []).map((word, i) => ({ id: `w${i + 1}`, noiDung: word }));
    });
    return map;
  }, [session]);

  const gradeQuestion = async (q, opt) => {
    const known = revealed.current[q.id];
    if (known) {
      const dung = opt ? (known.luaChonId ? opt.id === known.luaChonId : sameWord(opt.noiDung, known.noiDung)) : false;
      return { dung, ...known };
    }
    const body = opt && q.phuongAn?.length ? { luaChonId: opt.id } : { noiDung: opt?.noiDung || '' };
    const result = await checkAnswer(id, q.id, body);
    const info = {
      luaChonId: result.dapAn?.luaChonId || null,
      noiDung: result.dapAn?.noiDung || '',
      nghiaVi: result.giaiThich?.nghiaVi || result.giaiThich?.the?.nghiaVi || ''
    };
    revealed.current[q.id] = info;
    return { dung: result.dung, ...info };
  };

  const submitMutation = useMutation({
    mutationFn: (body) =>
      apiFetch(`/api/v1/practice/sessions/${id}/submissions`, {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    onSuccess: () => {},
    onError: (err) => {
      if (err.status === 409) return;
      setSubmitError(err.message || 'Chưa nộp được bài lên hệ thống.');
    }
  });

  const questions = activeQuestions;
  const currentQ = questions[currentIndex] || questions[0];
  const total = questions.length;
  const isLastQuestion = currentIndex === total - 1;
  const currentAnswer = currentQ ? answers[currentQ.id] : null;
  const currentFb = currentQ ? feedback[currentQ.id] : null;

  useEffect(() => {
    if (questions.length === 0 || isFinished) return;
    const q = questions[currentIndex];
    if (!q) return;

    if (!answers[q.id]) {
      setTimeLeft(HINI_TIME_LIMIT);
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
    }
  }, [currentIndex, isFinished, questions, answers]);

  useEffect(() => {
    if (!isTimerActive || isFinished) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTimerActive(false);
          handleTimeout();
          return 0;
        }
        if (prev <= 6) {
          SFX.tick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, isFinished, currentIndex]);

  const handleTimeout = async () => {
    if (!currentQ || answers[currentQ.id]) return;
    SFX.timeup();
    const q = currentQ;
    setAnswers((prev) => ({ ...prev, [q.id]: '__TIMEOUT__' }));
    setWrongQuestions((prev) => (prev.some((wq) => wq.id === q.id) ? prev : [...prev, q]));
    let info = { noiDung: '', nghiaVi: '' };
    try {
      info = await gradeQuestion(q, null);
    } catch (err) {
      setSubmitError(err.message || 'Chưa lấy được đáp án. Thử lại.');
    }
    setFeedback((prev) => ({
      ...prev,
      [q.id]: {
        isCorrect: false,
        isTimeout: true,
        selectedText: '(Hết thời gian)',
        correctText: info.noiDung,
        correctMeaning: info.nghiaVi
      }
    }));
  };

  const handleSelectOption = async (questionId, opt) => {
    if (answers[questionId] || !isTimerActive) return;
    setIsTimerActive(false);
    SFX.select();
    speak(opt.noiDung);
    const q = currentQ;
    setAnswers((prev) => ({ ...prev, [questionId]: opt.noiDung || opt.id }));

    let graded;
    try {
      graded = await gradeQuestion(q, opt);
    } catch (err) {
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      setSubmitError(err.message || 'Chưa chấm được câu này. Thử lại.');
      setIsTimerActive(true);
      return;
    }
    setSubmitError('');

    if (graded.dung) {
      setScore((prev) => prev + 10);
      setCorrectCount((prev) => prev + 1);
      SFX.correct();
    } else {
      SFX.wrong();
      setWrongQuestions((prev) => (prev.some((wq) => wq.id === q.id) ? prev : [...prev, q]));
    }

    setFeedback((prev) => ({
      ...prev,
      [questionId]: {
        isCorrect: graded.dung,
        isTimeout: false,
        selectedText: opt.noiDung,
        correctText: graded.noiDung,
        correctMeaning: graded.nghiaVi
      }
    }));
  };

  const handleSubmitSession = () => {
    const originalQuestions = session?.cauHoi || [];
    const traLoi = originalQuestions.map((q) => {
      const ansVal = answers[q.id];
      const noiDung = ansVal === '__TIMEOUT__' ? '' : typeof ansVal === 'string' ? ansVal : '';
      const chosen = q.phuongAn?.length ? q.phuongAn.find(opt => opt.noiDung === noiDung) : null;
      return chosen ? { cauHoiId: q.id, luaChonId: chosen.id } : { cauHoiId: q.id, noiDung };
    });

    if (!submitKey.current) submitKey.current = submitKeyFor(id);
    setSubmitError('');
    submitMutation.mutate({
      submitKey: submitKey.current,
      traLoi,
      thoiGian: now() - startRef.current
    });
  };

  const handleContinue = () => {
    SFX.select();
    if (isLastQuestion) {
      if (!isRetryMode) {
        handleSubmitSession();
      }
      setIsFinished(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleStartRetry = () => {
    SFX.select();
    const retryQs = shuffle(wrongQuestions.map((q) => ({ ...q })));
    setActiveQuestions(retryQs);
    setAnswers({});
    setFeedback({});
    setWrongQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setIsRetryMode(true);
    setIsFinished(false);
    setTimeLeft(HINI_TIME_LIMIT);
    setIsTimerActive(true);
  };

  const handleRestartAll = () => {
    SFX.select();
    setActiveQuestions(session?.cauHoi || []);
    setAnswers({});
    setFeedback({});
    setWrongQuestions([]);
    setCurrentIndex(0);
    setScore(0);
    setCorrectCount(0);
    setIsRetryMode(false);
    setIsFinished(false);
    setTimeLeft(HINI_TIME_LIMIT);
    setIsTimerActive(true);
  };

  const [full, setFull] = useState(false);
  useFocusMode(setFull);

  const activeOptions = currentQ ? (questionOptionsMap[currentQ.id] || currentQ.phuongAn || []) : [];

  useEffect(() => {
    if (isFinished) return;
    const onKey = (e) => {
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (currentFb) {
        if (e.key === 'Enter' && !submitMutation.isPending) { e.preventDefault(); handleContinue(); }
        return;
      }
      const idx = ['1', '2', '3', '4'].indexOf(e.key) >= 0 ? Number(e.key) - 1 : HINI_LABELS.indexOf(e.key.toUpperCase());
      if (idx >= 0 && activeOptions[idx]) { e.preventDefault(); handleSelectOption(currentQ.id, activeOptions[idx]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const exitButton = (
    <button type="button" className="btn btn-quiet btn-icon" aria-label="Thoát bài luyện" title="Thoát bài luyện" onClick={() => router.push('/luyen-tap')}><Icon name="x" /></button>
  );
  const barTools = (
    <>
      <SoundToggle />
      <ThemeToggle className="theme-session" />
      <button type="button" className="btn btn-quiet btn-icon" aria-pressed={full} aria-label={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'} title={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'} onClick={toggleFullscreen}><FullscreenIcon on={full} /></button>
    </>
  );
  const barTitle = `Bài luyện · ${label(PRACTICE_TYPE, session.loaiBai)}${isRetryMode ? ' · Luyện lại câu sai' : ''}`;

  if (isFinished) {
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const titleText = accuracy >= 90 ? 'Làm rất tốt' : accuracy >= 70 ? 'Khá tốt' : 'Cần luyện thêm';
    const hasWrong = wrongQuestions.length > 0;

    return (
      <div className="session">
        <header className="session-bar">
          {exitButton}
          <div className="grow">
            <p className="bar-title">{barTitle}</p>
            <p className="bar-sub">{session.boTheTen && <span>{session.boTheTen}</span>}<span>Đã xong {total} câu</span></p>
          </div>
          {barTools}
        </header>
        <div className="meter is-progress session-meter" role="progressbar" aria-label="Tiến độ bài luyện" aria-valuemin={0} aria-valuemax={total} aria-valuenow={total}>
          <span style={{ '--v': 1 }} />
        </div>

        <main className={`session-main ${styles.main}`} id="main">
          <section className={`sheet ${styles.question} ${styles.answered}`} aria-labelledby="hini-end-title">
            <h2 id="hini-end-title" className={styles.endTitle}>{titleText}</h2>
            <dl className={styles.endStats}>
              <div><dt>Câu đúng</dt><dd>{correctCount}/{total}</dd></div>
              <div><dt>Độ chính xác</dt><dd>{accuracy}%</dd></div>
              <div><dt>Điểm</dt><dd>{score}</dd></div>
            </dl>
            {isRetryMode && <p className={styles.intro}>Kết quả luyện lại không thay đổi bài đã nộp.</p>}
            {submitError && <p className="notice notice-danger" role="alert">{submitError}</p>}
            <div className={styles.endActions}>
              {hasWrong && (
                <Button variant="primary" size="lg" onClick={handleStartRetry}>Luyện lại {wrongQuestions.length} câu sai</Button>
              )}
              {!isRetryMode && (
                <Button variant={hasWrong ? 'secondary' : 'primary'} size={hasWrong ? undefined : 'lg'} onClick={() => router.push(`/luyen-tap-ket-qua?id=${id}`)}>Xem kết quả chi tiết</Button>
              )}
              <Button variant="secondary" onClick={handleRestartAll}>Làm lại từ đầu</Button>
              <Link href="/luyen-tap" className="btn btn-quiet">Về trang Luyện tập</Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const answeredSoFar = currentIndex + (currentFb ? 1 : 0);
  const lowTime = timeLeft <= 5 && !currentFb;
  const blankWord =
    currentAnswer === '__TIMEOUT__' ? 'hết giờ' : typeof currentAnswer === 'string' ? currentAnswer : '';
  const blankClass = `${styles.blank}${currentFb ? ` ${currentFb.isCorrect ? styles.blankRight : styles.blankWrong}` : ''}`;
  const context =
    currentQ?.deBai?.dichVi || currentQ?.deBai?.viDuVi || currentQ?.deBai?.goiY || '';

  return (
    <div className="session">
      <header className="session-bar">
        {exitButton}
        <div className="grow">
          <p className="bar-title">{barTitle}</p>
          <p className="bar-sub">{session.boTheTen && <span>{session.boTheTen}</span>}<span>Câu {currentIndex + 1} / {total} · Đúng {correctCount} · {score} điểm</span></p>
        </div>
        <span className={`stamp ${lowTime ? 'stamp-danger' : ''} ${styles.timer}`} role="timer" aria-label={`Còn ${timeLeft} giây`}><Icon name="clock" />{timeLeft}s</span>
        {barTools}
      </header>
      <div className="meter is-progress session-meter" role="progressbar" aria-label="Số câu đã làm" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answeredSoFar}>
        <span style={{ '--v': total ? answeredSoFar / total : 0 }} />
      </div>

      <main className={`session-main ${styles.main}`} id="main">
        <p className={styles.intro}>Chọn từ đúng cho chỗ trống trong {HINI_TIME_LIMIT} giây. Có thể bấm phím 1–4, sau đó Enter để sang câu tiếp.</p>

        <section className={`sheet ${styles.question}${currentFb ? ` ${styles.answered}` : ''}`} aria-labelledby="hini-q-title">
          <div className={styles.qHead}>
            <span className={styles.qNo}>{currentIndex + 1}</span>
            <span id="hini-q-title" className={styles.qType}>{label(PRACTICE_TYPE, currentQ?.loaiCau || session.loaiBai)}</span>
          </div>

          <div className={`meter ${styles.countdown}${lowTime ? ` ${styles.countdownLow}` : ''}`} aria-hidden="true">
            <span style={{ '--v': timeLeft / HINI_TIME_LIMIT }} />
          </div>

          {currentQ?.deBai?.cau ? (
            <div className={styles.sentence} lang="en"><BlankSentence sentence={currentQ.deBai.cau} mark={blankWord} className={blankClass} /></div>
          ) : (
            <div className={styles.prompt}>{currentQ?.deBai?.nghiaVi || 'Câu hỏi'}</div>
          )}

          {(context || currentQ?.deBai?.tuLoai) && (
            <p className={styles.hint}>
              {currentQ?.deBai?.tuLoai && <span className="pos">{currentQ.deBai.tuLoai}</span>}
              {context && <span>{context}</span>}
            </p>
          )}

          {activeOptions.length > 0 && (
            <div className={styles.options} role="group" aria-label={`Phương án câu ${currentIndex + 1}`}>
              {activeOptions.map((opt, i) => {
                const isSelected = currentAnswer === opt.noiDung || currentAnswer === opt.id;
                const isOptionCorrect = !!currentFb && sameWord(opt.noiDung, currentFb.correctText);
                let state = '';
                if (currentFb) {
                  if (isOptionCorrect) state = ` ${styles.right}`;
                  else if (isSelected) state = ` ${styles.wrong}`;
                } else if (isSelected) state = ` ${styles.picked}`;
                return (
                  <button
                    key={opt.id || opt.noiDung}
                    type="button"
                    className={`${styles.option}${state}`}
                    aria-pressed={isSelected}
                    disabled={!!currentFb || !isTimerActive}
                    onClick={() => handleSelectOption(currentQ.id, opt)}
                  >
                    <span className={styles.key}>{i + 1}</span>
                    <span lang="en">{opt.noiDung}</span>
                    {currentFb && isOptionCorrect && <Icon name="check" className={styles.optMark} />}
                    {currentFb && isSelected && !isOptionCorrect && <Icon name="x" className={styles.optMark} />}
                  </button>
                );
              })}
            </div>
          )}

          {currentFb && (
            <div className={`notice ${currentFb.isCorrect ? 'notice-success' : 'notice-danger'}`} role="status">
              <div>
              <p className="notice-title">
                {currentFb.isCorrect ? 'Đúng rồi' : currentFb.isTimeout ? 'Hết thời gian' : <>Chưa đúng · bạn chọn <span lang="en">{currentFb.selectedText}</span></>}
              </p>
              {currentFb.correctText && <p>Đáp án: <strong lang="en">{currentFb.correctText}</strong>{currentFb.correctMeaning && <> · {currentFb.correctMeaning}</>}</p>}
              </div>
            </div>
          )}
        </section>

        {submitError && <p className="notice notice-danger" role="alert">{submitError}</p>}

        {currentFb && (
          <div className={styles.footer}>
            <div><strong>{answeredSoFar}/{total}</strong> câu đã làm</div>
            <Button variant="primary" size="lg" onClick={handleContinue} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? 'Đang nộp…' : isLastQuestion ? 'Xem kết quả' : 'Câu tiếp'}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

const MATCH_ROUND_TIME = 45;

function soundOn() {
  try { return localStorage.getItem('vl-sound') !== 'off'; } catch { return true; }
}

function MatchingGameView({ session, id }) {
  const router = useRouter();
  const startRef = useRef(0);
  const submitKey = useRef('');
  const noteTimer = useRef(null);

  const questions = useMemo(() => session.cauHoi || [], [session]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundCards, setRoundCards] = useState([]);
  const [selectedCards, setSelectedCards] = useState([]);
  const [correctUids, setCorrectUids] = useState(new Set());
  const [wrongUids, setWrongUids] = useState(new Set());
  const [matchedUids, setMatchedUids] = useState(new Set());

  const [score, setScore] = useState(0);
  const [pairsMatched, setPairsMatched] = useState(0);
  const [answers, setAnswers] = useState({});
  const [note, setNote] = useState('');

  const [timeLeft, setTimeLeft] = useState(MATCH_ROUND_TIME);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [full, setFull] = useState(false);
  useFocusMode(setFull);

  const currentQ = questions[roundIndex] || questions[0];
  const totalPairsCount = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.deBai?.cotTrai?.length || 0), 0);
  }, [questions]);

  useEffect(() => {
    startRef.current = now();
    return () => clearTimeout(noteTimer.current);
  }, []);

  const submitMutation = useMutation({
    mutationFn: (body) =>
      apiFetch(`/api/v1/practice/sessions/${id}/submissions`, {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    onError: (err) => {
      if (err.status === 409) return;
      setSubmitError(err.message || 'Chưa nộp được bài. Thử lại sau ít phút.');
    }
  });

  const showNote = (msg) => {
    clearTimeout(noteTimer.current);
    setNote(msg);
    noteTimer.current = setTimeout(() => setNote(''), 2400);
  };

  const playCustomTone = (freq, type = 'sine', duration = 0.15, vol = 0.1) => {
    if (!soundOn()) return;
    playTone(freq, type, duration, vol);
  };

  const playSuccessSound = () => {
    if (!soundOn()) return;
    playTone(523.25, 'triangle', 0.12, 0.15);
    setTimeout(() => playTone(659.25, 'triangle', 0.12, 0.15), 90);
    setTimeout(() => playTone(783.99, 'triangle', 0.25, 0.2), 180);
  };

  const playErrorSound = () => {
    if (!soundOn()) return;
    playTone(220, 'sawtooth', 0.15, 0.12);
    setTimeout(() => playTone(180, 'sawtooth', 0.2, 0.12), 120);
  };

  const speakEnglish = (word) => {
    if (!soundOn() || !word) return;
    speak(word);
  };

  useEffect(() => {
    if (!currentQ || !currentQ.deBai) return;
    const cotTrai = currentQ.deBai.cotTrai || [];
    const cotPhai = currentQ.deBai.cotPhai || [];
    const list = [
      ...cotTrai.map((t) => ({ uid: `en_${currentQ.id}_${t.id}`, id: t.id, text: t.noiDung, type: 'en' })),
      ...cotPhai.map((n) => ({ uid: `vi_${currentQ.id}_${n.id}`, id: n.id, text: n.noiDung, type: 'vi' }))
    ];
    setRoundCards(shuffle(list));
    setSelectedCards([]);
    setCorrectUids(new Set());
    setWrongUids(new Set());
    setMatchedUids(new Set());
    setTimeLeft(MATCH_ROUND_TIME);
  }, [roundIndex, currentQ]);

  useEffect(() => {
    if (isPaused || isFinished) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleTimeOver();
          return 0;
        }
        if (prev <= 10 && soundOn()) {
          playTone(800, 'sine', 0.05, 0.04);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isFinished]);

  const handleSubmitSession = (finalAnswers = answers) => {
    const traLoi = questions.map((q) => ({ cauHoiId: q.id, cap: finalAnswers[q.id] || [] }));
    if (!submitKey.current) submitKey.current = submitKeyFor(id);
    setSubmitError('');
    submitMutation.mutate({
      submitKey: submitKey.current,
      traLoi,
      thoiGian: now() - startRef.current
    });
  };

  const handleTimeOver = () => {
    playErrorSound();
    handleSubmitSession();
    setIsFinished(true);
  };

  const handleCardClick = async (card) => {
    if (isPaused || timeLeft <= 0 || isFinished) return;
    if (matchedUids.has(card.uid) || correctUids.has(card.uid)) return;

    if (selectedCards.some((c) => c.uid === card.uid)) {
      setSelectedCards((prev) => prev.filter((c) => c.uid !== card.uid));
      return;
    }
    if (selectedCards.length >= 2) return;

    const sameSide = selectedCards.find((c) => c.type === card.type);
    const newSelected = sameSide ? [...selectedCards.filter((c) => c.type !== card.type), card] : [...selectedCards, card];
    setSelectedCards(newSelected);
    playCustomTone(card.type === 'en' ? 440 : 380, 'sine', 0.08, 0.06);
    if (card.type === 'en') speakEnglish(card.text);

    if (newSelected.length !== 2) return;
    const enCard = newSelected.find((c) => c.type === 'en');
    const viCard = newSelected.find((c) => c.type === 'vi');
    let isMatch = false;
    try {
      const result = await checkAnswer(id, currentQ.id, { cap: [{ traiId: enCard.id, phaiId: viCard.id }] });
      isMatch = !!result.dung;
    } catch (err) {
      showNote(err.message || 'Chưa chấm được cặp này. Thử lại.');
      setSelectedCards([]);
      return;
    }

    if (isMatch) {
      setCorrectUids((prev) => new Set([...prev, enCard.uid, viCard.uid]));
      playSuccessSound();
      setScore((prev) => prev + 25);
      setPairsMatched((prev) => prev + 1);
      setTimeLeft((prev) => Math.min(MATCH_ROUND_TIME, prev + 3));

      const updatedAnswers = {
        ...answers,
        [currentQ.id]: [...(answers[currentQ.id] || []), { traiId: enCard.id, phaiId: viCard.id }]
      };
      setAnswers(updatedAnswers);

      setTimeout(() => {
        setMatchedUids((prev) => {
          const next = new Set([...prev, enCard.uid, viCard.uid]);
          if (next.size >= roundCards.length && roundCards.length > 0) {
            if (roundIndex + 1 < questions.length) {
              showNote('Xong vòng này, cộng 50 điểm. Sang vòng tiếp.');
              setScore((s) => s + 50);
              setTimeout(() => setRoundIndex((r) => r + 1), 600);
            } else {
              handleSubmitSession(updatedAnswers);
              setIsFinished(true);
            }
          }
          return next;
        });
        setSelectedCards([]);
        setCorrectUids(new Set());
      }, 350);
    } else {
      setWrongUids(new Set([enCard.uid, viCard.uid]));
      playErrorSound();
      setTimeout(() => {
        setSelectedCards([]);
        setWrongUids(new Set());
      }, 500);
    }
  };

  const handleRestart = () => {
    setRoundIndex(0);
    setScore(0);
    setPairsMatched(0);
    setAnswers({});
    setSelectedCards([]);
    setCorrectUids(new Set());
    setWrongUids(new Set());
    setMatchedUids(new Set());
    setTimeLeft(MATCH_ROUND_TIME);
    setIsPaused(false);
    setIsFinished(false);
    setSubmitError('');
    startRef.current = now();
  };

  const barTitle = `Bài luyện · ${label(PRACTICE_TYPE, session.loaiBai)}`;
  const exitButton = (
    <button type="button" className="btn btn-quiet btn-icon" aria-label="Thoát bài luyện" title="Thoát bài luyện" onClick={() => router.push('/luyen-tap')}><Icon name="x" /></button>
  );
  const barTools = (
    <>
      <SoundToggle />
      <ThemeToggle className="theme-session" />
      <button type="button" className="btn btn-quiet btn-icon" aria-pressed={full} aria-label={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'} title={full ? 'Thoát toàn màn hình' : 'Toàn màn hình'} onClick={toggleFullscreen}><FullscreenIcon on={full} /></button>
    </>
  );

  if (isFinished) {
    const allDone = totalPairsCount > 0 && pairsMatched >= totalPairsCount;
    const titleText = allDone ? 'Đã nối hết các cặp' : 'Hết giờ';
    return (
      <div className="session">
        <header className="session-bar">
          {exitButton}
          <div className="grow">
            <p className="bar-title">{barTitle}</p>
            <p className="bar-sub">{session.boTheTen && <span>{session.boTheTen}</span>}<span>Đã nộp bài</span></p>
          </div>
          {barTools}
        </header>
        <div className="meter is-progress session-meter" role="progressbar" aria-label="Số cặp đã nối" aria-valuemin={0} aria-valuemax={totalPairsCount} aria-valuenow={pairsMatched}>
          <span style={{ '--v': totalPairsCount ? pairsMatched / totalPairsCount : 0 }} />
        </div>
        <main className={`session-main ${styles.main}`} id="main">
          <section className={`sheet ${styles.question} ${styles.answered}`} aria-labelledby="match-end-title">
            <h2 id="match-end-title" className={styles.endTitle}>{titleText}</h2>
            <dl className={styles.endStats}>
              <div><dt>Cặp đã nối</dt><dd>{pairsMatched}/{totalPairsCount}</dd></div>
              <div><dt>Vòng</dt><dd>{Math.min(roundIndex + 1, questions.length)}/{questions.length}</dd></div>
              <div><dt>Điểm</dt><dd>{score}</dd></div>
            </dl>
            {submitMutation.isPending && <p className={styles.intro} role="status">Đang nộp bài…</p>}
            {submitError && <p className="notice notice-danger" role="alert">{submitError}</p>}
            <div className={styles.endActions}>
              <Button variant="primary" size="lg" disabled={submitMutation.isPending} onClick={() => router.push(`/luyen-tap-ket-qua?id=${id}`)}>Xem kết quả chi tiết</Button>
              <Button variant="secondary" onClick={handleRestart}>Làm lại</Button>
              <Link href="/luyen-tap" className="btn btn-quiet">Về trang Luyện tập</Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const lowTime = timeLeft <= 10;
  const enCards = roundCards.filter((c) => c.type === 'en');
  const viCards = roundCards.filter((c) => c.type === 'vi');

  const renderCard = (card) => {
    const isSelected = selectedCards.some((c) => c.uid === card.uid);
    const isCorrect = correctUids.has(card.uid);
    const isWrong = wrongUids.has(card.uid);
    const isMatched = matchedUids.has(card.uid);
    let state = '';
    if (isMatched) state = ` ${styles.matched}`;
    else if (isCorrect) state = ` ${styles.right}`;
    else if (isWrong) state = ` ${styles.wrong}`;
    else if (isSelected) state = ` ${styles.picked}`;
    return (
      <button
        key={card.uid}
        type="button"
        className={`${styles.option}${state}`}
        aria-pressed={isSelected}
        disabled={isMatched || isPaused}
        onClick={() => handleCardClick(card)}
      >
        <span className={card.type === 'en' ? styles.pairWord : styles.pairMeaning} lang={card.type === 'en' ? 'en' : undefined}>{card.text}</span>
        {(isMatched || isCorrect) && <Icon name="check" className={styles.optMark} />}
        {isWrong && <Icon name="x" className={styles.optMark} />}
      </button>
    );
  };

  return (
    <div className="session">
      <header className="session-bar">
        {exitButton}
        <div className="grow">
          <p className="bar-title">{barTitle}</p>
          <p className="bar-sub">{session.boTheTen && <span>{session.boTheTen}</span>}<span>{questions.length > 1 ? `Vòng ${roundIndex + 1} / ${questions.length} · ` : ''}{pairsMatched} / {totalPairsCount} cặp · {score} điểm</span></p>
        </div>
        <span className={`stamp ${lowTime ? 'stamp-danger' : ''} ${styles.timer}`} role="timer" aria-label={`Còn ${timeLeft} giây`}><Icon name="clock" />{timeLeft}s</span>
        <button type="button" className="btn btn-quiet btn-icon" aria-pressed={isPaused} aria-label={isPaused ? 'Tiếp tục' : 'Tạm dừng'} title={isPaused ? 'Tiếp tục' : 'Tạm dừng'} onClick={() => setIsPaused((p) => !p)}><Icon name={isPaused ? 'play' : 'pause'} /></button>
        {barTools}
      </header>
      <div className="meter is-progress session-meter" role="progressbar" aria-label="Số cặp đã nối" aria-valuemin={0} aria-valuemax={totalPairsCount} aria-valuenow={pairsMatched}>
        <span style={{ '--v': totalPairsCount ? pairsMatched / totalPairsCount : 0 }} />
      </div>

      <main className={`session-main ${styles.main}`} id="main">
        <p className={styles.intro}>Chọn một từ tiếng Anh rồi chọn nghĩa đúng của nó. Mỗi cặp đúng được cộng 3 giây.</p>

        <section className={`sheet ${styles.question}`} aria-labelledby="match-q-title">
          <div className={styles.qHead}>
            <span className={styles.qNo}>{roundIndex + 1}</span>
            <span id="match-q-title" className={styles.qType}>{label(PRACTICE_TYPE, currentQ?.loaiCau || session.loaiBai)}</span>
          </div>

          <div className={`meter ${styles.countdown}${lowTime ? ` ${styles.countdownLow}` : ''}`} aria-hidden="true">
            <span style={{ '--v': timeLeft / MATCH_ROUND_TIME }} />
          </div>

          {isPaused ? (
            <div className={`notice notice-warning ${styles.paused}`} role="status">
              <div>
                <p className="notice-title">Đã tạm dừng</p>
                <p>Đồng hồ đang dừng. Bấm Tiếp tục để làm tiếp.</p>
              </div>
              <Button variant="primary" onClick={() => setIsPaused(false)}>Tiếp tục</Button>
            </div>
          ) : (
            <div className={styles.pairBoard}>
              <div className={styles.pairCol} role="group" aria-label="Từ tiếng Anh">
                <p className={styles.pairHead}>Từ tiếng Anh</p>
                {enCards.map(renderCard)}
              </div>
              <div className={styles.pairCol} role="group" aria-label="Nghĩa tiếng Việt">
                <p className={styles.pairHead}>Nghĩa tiếng Việt</p>
                {viCards.map(renderCard)}
              </div>
            </div>
          )}

          <p className={styles.pairNote} role="status" aria-live="polite">{note}</p>
        </section>

        {submitError && <p className="notice notice-danger" role="alert">{submitError}</p>}
      </main>
    </div>
  );
}

function BlankSentence({ sentence, mark = '', className = styles.blank }) {
  const [before, after] = splitBlank(sentence);
  if (after === null) return before;
  return <>{before}<span className={className}>{mark}</span>{after}</>;
}

function ListenPrompt({ practiceId, questionId, hasAudio, tuLoai }) {
  const [error, setError] = useState('');
  const [loadingAudio, setLoadingAudio] = useState(false);
  const cached = useRef(null);
  const audioFile = async () => {
    const c = cached.current;
    if (c && (!c.expiresAt || new Date(c.expiresAt).getTime() - 30000 > now())) return c;
    const file = await apiFetch(`/api/v1/practice/sessions/${practiceId}/questions/${questionId}/audio`);
    cached.current = file;
    return file;
  };
  const listen = async (rate = 1) => {
    setError('');
    setLoadingAudio(true);
    try {
      const file = await audioFile();
      if (file.moPhong && file.vanBanDoc) await speakText(file.vanBanDoc, rate);
      else await playAudio(file.downloadUrl, rate).catch(() => { throw new Error('Trình duyệt chưa phát được âm thanh. Thử lại hoặc kiểm tra loa.'); });
    } catch (err) {
      cached.current = null;
      setError(err.message || 'Không tải được âm thanh. Thử lại.');
    } finally {
      setLoadingAudio(false);
    }
  };

  if (!hasAudio) return <p className="notice notice-warning">Câu này chưa có âm thanh.</p>;

  return (
    <div className={styles.listen}>
      <div className={styles.listenBtns}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => listen(1)}
          disabled={loadingAudio}
          aria-busy={loadingAudio}
        >
          <Icon name="volume" /> Nghe
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => listen(0.65)}
          disabled={loadingAudio}
        >
          Nghe chậm
        </button>
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

  if (session.loaiBai === 'DIEN_CHO_TRONG') {
    return <HiniGameView session={session} id={id} />;
  }
  if (session.loaiBai === 'GHEP_TU') {
    return <MatchingGameView session={session} id={id} />;
  }

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
        <ListenPrompt
          practiceId={id}
          questionId={q.id}
          hasAudio={!!(q.deBai?.amTuId || q.deBai?.amThanhTts)}
          tuLoai={q.deBai?.tuLoai}
        />
      ) : q.deBai?.cau ? (
        <div className={styles.sentence} lang="en"><BlankSentence sentence={q.deBai.cau} /></div>
      ) : (
        <div className={styles.prompt}>{q.deBai?.nghiaVi}</div>
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
