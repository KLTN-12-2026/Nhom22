'use client';
import { useState, Suspense, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';
import { label } from '@/lib/practice-labels.mjs';
import styles from './page.module.css';

const TIME_LIMIT = 20;
const LABELS = ['A', 'B', 'C', 'D'];

const FALLBACK_DISTRACTORS = [
  { tu: 'achievement', nghiaVi: 'thành tựu' },
  { tu: 'challenge', nghiaVi: 'thử thách' },
  { tu: 'development', nghiaVi: 'sự phát triển' },
  { tu: 'opportunity', nghiaVi: 'cơ hội' },
  { tu: 'experience', nghiaVi: 'kinh nghiệm' },
  { tu: 'knowledge', nghiaVi: 'kiến thức' },
  { tu: 'solution', nghiaVi: 'giải pháp' },
  { tu: 'progress', nghiaVi: 'sự tiến bộ' }
];

const now = () => Date.now();

const randomPart = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

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

// Web Audio API Synthesizer (Zero-latency, offline-first)
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

function playAudioFile(url, rate = 1) {
  const audio = new Audio(url);
  audio.playbackRate = rate;
  return audio.play();
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function ListenPrompt({ practiceId, questionId, hasAudio, tuLoai }) {
  const [error, setError] = useState('');
  const [loadingAudio, setLoadingAudio] = useState(false);
  const cached = useRef(null);
  if (!hasAudio) return <p className="notice notice-warning" style={{ marginBottom: 'var(--space-3)' }}>Câu này chưa có âm thanh.</p>;

  const audioUrl = async () => {
    const c = cached.current;
    if (c && (!c.expiresAt || new Date(c.expiresAt).getTime() - 30000 > now())) return c.downloadUrl;
    const file = await apiFetch(`/api/v1/practice/sessions/${practiceId}/questions/${questionId}/audio`);
    cached.current = file;
    return file.downloadUrl;
  };

  const listen = async (rate) => {
    setError('');
    setLoadingAudio(true);
    try {
      const url = await audioUrl();
      await playAudioFile(url, rate).catch(() => {
        throw new Error('Trình duyệt chưa phát được âm thanh. Thử lại hoặc kiểm tra loa.');
      });
    } catch (err) {
      cached.current = null;
      setError(err.message || 'Không tải được âm thanh. Thử lại.');
    } finally {
      setLoadingAudio(false);
    }
  };

  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <Button type="button" variant="secondary" onClick={() => listen(1)} disabled={loadingAudio}>
          <Icon name="volume" /> Nghe
        </Button>
        <Button type="button" variant="ghost" onClick={() => listen(0.6)} disabled={loadingAudio}>
          Nghe chậm
        </Button>
      </div>
      <p style={{ fontSize: 'var(--font-size-sm)', color: '#94a3b8', marginTop: 'var(--space-2)' }}>
        {tuLoai && <>Từ loại <span style={{ color: '#a78bfa' }}>[{tuLoai}]</span>, </>}nghe bao nhiêu lần cũng được
      </p>
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}

function PracticeSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const startRef = useRef(0);
  const submitKey = useRef('');

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['practice-session', id],
    queryFn: () => apiFetch(`/api/v1/practice/sessions/${id}`),
    enabled: !!id
  });

  const [activeQuestions, setActiveQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState({});
  const [wrongQuestions, setWrongQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Initial setup when session loads
  useEffect(() => {
    if (session?.cauHoi && session.cauHoi.length > 0 && activeQuestions.length === 0) {
      setActiveQuestions(session.cauHoi);
      startRef.current = now();
      setIsTimerActive(true);
    }
  }, [session?.cauHoi, activeQuestions.length]);

  useEffect(() => {
    if (session?.daNop && !isFinished) {
      router.replace(`/luyen-tap-ket-qua?id=${id}`);
    }
  }, [session?.daNop, isFinished, id, router]);

  // Generate 4 multiple-choice options (1 correct + 3 distractors) for DIEN_CHO_TRONG from session deck cards
  const questionOptionsMap = useMemo(() => {
    if (!session?.cauHoi) return {};
    const map = {};
    const allCards = session.cauHoi
      .map(q => ({
        tu: q.deBai?.tu || q.deBai?.goiY || '',
        nghiaVi: q.deBai?.goiY || q.deBai?.dichVi || ''
      }))
      .filter(c => c.tu);

    session.cauHoi.forEach(q => {
      if (q.phuongAn && Array.isArray(q.phuongAn) && q.phuongAn.length > 0) {
        map[q.id] = q.phuongAn;
        return;
      }

      const targetWord = q.deBai?.tu || q.deBai?.goiY || '';
      const targetMeaning = q.deBai?.goiY || q.deBai?.dichVi || '';

      const pool = allCards.filter(c => c.tu.toLowerCase() !== targetWord.toLowerCase());
      const uniquePool = [];
      const seen = new Set();
      pool.forEach(item => {
        const key = item.tu.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          uniquePool.push(item);
        }
      });

      const shuffledPool = shuffle(uniquePool);
      const chosenDistractors = shuffledPool.slice(0, 3);

      if (chosenDistractors.length < 3) {
        for (const fb of FALLBACK_DISTRACTORS) {
          if (chosenDistractors.length >= 3) break;
          const key = fb.tu.toLowerCase();
          if (key !== targetWord.toLowerCase() && !seen.has(key)) {
            chosenDistractors.push(fb);
            seen.add(key);
          }
        }
      }

      const rawOpts = [
        { id: `opt_corr_${q.id}`, noiDung: targetWord, nghiaVi: targetMeaning, isCorrect: true },
        ...chosenDistractors.map((d, i) => ({
          id: `opt_dist_${q.id}_${i}`,
          noiDung: d.tu,
          nghiaVi: d.nghiaVi,
          isCorrect: false
        }))
      ];

      map[q.id] = shuffle(rawOpts);
    });
    return map;
  }, [session]);

  const submitMutation = useMutation({
    mutationFn: (body) =>
      apiFetch(`/api/v1/practice/sessions/${id}/submissions`, {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    onSuccess: () => {
      // Result recorded in backend; keep user on HINI end screen for review / retry
    },
    onError: (err) => {
      if (err.status === 409) return;
      setSubmitError(err.message || 'Chưa nộp được bài lên hệ thống.');
    }
  });

  const questions = activeQuestions;
  const currentQ = questions[currentIndex] || questions[0];
  const total = questions.length;
  const isLastQuestion = currentIndex === total - 1;
  const progressPercent = total > 0 ? ((currentIndex + 1) / total) * 100 : 0;
  const currentAnswer = currentQ ? answers[currentQ.id] : null;
  const currentFb = currentQ ? feedback[currentQ.id] : null;

  // Question change timer reset
  useEffect(() => {
    if (questions.length === 0 || isFinished) return;
    const q = questions[currentIndex];
    if (!q) return;

    if (!answers[q.id]) {
      setTimeLeft(TIME_LIMIT);
      setIsTimerActive(true);
    } else {
      setIsTimerActive(false);
    }
  }, [currentIndex, isFinished, questions, answers]);

  // Countdown timer effect
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

  const handleTimeout = () => {
    if (!currentQ || answers[currentQ.id]) return;
    SFX.timeup();
    const qId = currentQ.id;
    setAnswers((prev) => ({ ...prev, [qId]: '__TIMEOUT__' }));

    const targetWord = currentQ.deBai?.tu || currentQ.deBai?.goiY || '';
    const targetMeaning = currentQ.deBai?.goiY || currentQ.deBai?.dichVi || '';

    setWrongQuestions((prev) => {
      if (prev.some((wq) => wq.id === currentQ.id)) return prev;
      return [...prev, currentQ];
    });

    setFeedback((prev) => ({
      ...prev,
      [qId]: {
        isCorrect: false,
        isTimeout: true,
        selectedText: '(Hết thời gian)',
        selectedMeaning: '',
        correctText: targetWord,
        correctMeaning: targetMeaning,
        explanationText: targetMeaning ? `Nghĩa: "${targetMeaning}"` : ''
      }
    }));
  };

  const handleSelectOption = (questionId, opt) => {
    if (answers[questionId] || !isTimerActive) return;
    setIsTimerActive(false);
    SFX.select();
    speak(opt.noiDung);

    const isCorrect =
      opt.isCorrect !== undefined
        ? opt.isCorrect
        : currentQ.dapAnDung
        ? opt.id === currentQ.dapAnDung
        : true;

    const selectedText = opt.noiDung;
    const targetWord = currentQ.deBai?.tu || currentQ.deBai?.goiY || currentQ.dapAnText || opt.noiDung;
    const targetMeaning = currentQ.deBai?.goiY || currentQ.deBai?.dichVi || '';

    setAnswers((prev) => ({ ...prev, [questionId]: opt.noiDung || opt.id }));

    if (isCorrect) {
      setScore((prev) => prev + 10);
      setCorrectCount((prev) => prev + 1);
      SFX.correct();
    } else {
      SFX.wrong();
      setWrongQuestions((prev) => {
        if (prev.some((wq) => wq.id === currentQ.id)) return prev;
        return [...prev, currentQ];
      });
    }

    setFeedback((prev) => ({
      ...prev,
      [questionId]: {
        isCorrect,
        isTimeout: false,
        selectedText,
        selectedMeaning: opt.nghiaVi || '',
        correctText: targetWord,
        correctMeaning: targetMeaning,
        explanationText: opt.nghiaVi || targetMeaning ? `Nghĩa: "${targetMeaning || opt.nghiaVi}"` : ''
      }
    }));
  };

  const handleInputChange = (questionId, value, subId = null) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (subId) {
        next[questionId] = { ...(next[questionId] || {}), [subId]: value };
      } else {
        next[questionId] = value;
      }
      return next;
    });
  };

  const handleSubmitSession = () => {
    const originalQuestions = session?.cauHoi || [];
    const traLoi = originalQuestions.map((q) => {
      if (q.loaiCau === 'GHEP_TU') {
        const cap =
          q.deBai?.cotTrai
            ?.map((l) => ({ traiId: l.id, phaiId: answers[q.id]?.[l.id] || null }))
            .filter((c) => c.phaiId) || [];
        return { cauHoiId: q.id, cap };
      }
      if (q.phuongAn && !questionOptionsMap[q.id]) {
        return { cauHoiId: q.id, luaChonId: answers[q.id] || null };
      }
      const ansVal = answers[q.id];
      const noiDung = ansVal === '__TIMEOUT__' ? '' : typeof ansVal === 'string' ? ansVal : '';
      return { cauHoiId: q.id, noiDung };
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
    setTimeLeft(TIME_LIMIT);
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
    setTimeLeft(TIME_LIMIT);
    setIsTimerActive(true);
  };

  // Find word to display in blank
  const chosenBlankWord =
    currentAnswer === '__TIMEOUT__'
      ? '(Hết giờ)'
      : typeof currentAnswer === 'string'
      ? currentAnswer
      : '';

  const renderSentenceWithBlank = (sentence) => {
    if (!sentence) return null;
    const parts = sentence.split(/_____|____|___|\?/g);
    const isAnswered = !!currentFb;
    const isCorr = currentFb?.isCorrect;

    let highlightClass = styles.blankHighlight;
    if (isAnswered) {
      highlightClass += isCorr ? ` ${styles.blankHighlightCorrect}` : ` ${styles.blankHighlightWrong}`;
    }

    if (parts.length <= 1) {
      return (
        <span>
          {sentence} <span className={highlightClass}>{chosenBlankWord || '_______'}</span>
        </span>
      );
    }
    return (
      <span>
        {parts[0]}
        <span className={highlightClass}>{chosenBlankWord || '_______'}</span>
        {parts.slice(1).join('_______')}
      </span>
    );
  };

  if (!id) return <div style={{ color: '#ffffff', padding: '30px', textAlign: 'center' }}>Phiên luyện tập không hợp lệ.</div>;
  if (error) return <div style={{ color: '#f87171', padding: '30px', textAlign: 'center' }}>{error.message || 'Chưa tải được bài luyện.'}</div>;
  if (isLoading || !session || !session.cauHoi || session.cauHoi.length === 0) {
    return <div style={{ color: '#ffffff', padding: '60px', textAlign: 'center' }}>Đang tải bài luyện tập...</div>;
  }

  // Active question options
  const activeOptions = currentQ ? (questionOptionsMap[currentQ.id] || currentQ.phuongAn) : [];

  // End Screen view
  if (isFinished) {
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const emoji = accuracy >= 90 ? '🏆' : accuracy >= 70 ? '⭐' : '📚';
    const titleText = accuracy >= 90 ? 'Xuất Sắc!' : accuracy >= 70 ? 'Khá Tốt!' : 'Cần Cố Gắng Thêm!';

    return (
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <div className={styles.endScreen}>
            <span className={styles.endEmoji}>{emoji}</span>
            <h2 className={styles.endTitle}>{titleText}</h2>
            <p className={styles.endScore}>
              Bạn trả lời đúng {correctCount}/{total} câu · Điểm: {score} · Độ chính xác: {accuracy}%
            </p>

            <div className={styles.retryActions}>
              {wrongQuestions.length > 0 && (
                <button type="button" className={styles.btnGold} onClick={handleStartRetry}>
                  🔄 LUYỆN LẠI CÂU SAI ({wrongQuestions.length} CÂU)
                </button>
              )}
              <button type="button" className={styles.btnOutline} onClick={handleRestartAll}>
                ↻ LÀM LẠI TỪ ĐẦU
              </button>
              <button
                type="button"
                className={styles.btnSecondaryAction}
                onClick={() => router.push(`/luyen-tap-ket-qua?id=${id}`)}
              >
                📊 XEM BÁO CÁO CHI TIẾT
              </button>
              <Link href="/luyen-tap" className={styles.btnExitEnd}>
                Quay về trang Luyện tập
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Top Header */}
        <div className={styles.topBar}>
          <Link href="/luyen-tap" className={styles.exitBtn}>
            <Icon name="arrow-left" size={16} /> Thoát
          </Link>

          <div className={styles.brandCenter}>
            <div className={styles.brandTitle}>
              {isRetryMode ? 'LUYỆN LẠI CÂU SAI 🔄' : (session.boTheTen || 'Luyện Tập Từ Vựng')}
            </div>
            <div className={styles.brandSub}>{label(session.loaiBai)}</div>
          </div>

          <div className={styles.statCards}>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{score}</span>
              <span className={styles.statLabel}>ĐIỂM</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{correctCount}</span>
              <span className={styles.statLabel}>CÂU ĐÚNG</span>
            </div>
          </div>
        </div>

        {/* Retry Badge */}
        {isRetryMode && (
          <div style={{ textAlign: 'center' }}>
            <span className={styles.retryBadge}>
              <Icon name="sparkles" size={13} /> Đang luyện lại các câu chưa đúng
            </span>
          </div>
        )}

        {/* Timer & Progress Bar (20s countdown) */}
        <div className={styles.timelineRow}>
          <span className={`${styles.timeDisplay} ${timeLeft <= 5 ? styles.timeDisplayDanger : ''}`}>
            {timeLeft}s
          </span>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressFill} ${timeLeft <= 5 ? styles.progressFillDanger : ''}`}
              style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className={styles.questionCard}>
          <span className={styles.questionTag}>
            QUESTION {currentIndex + 1} / {total}
          </span>
          <div className={styles.questionSentence}>
            {currentQ?.deBai?.cau ? (
              renderSentenceWithBlank(currentQ.deBai.cau)
            ) : (
              currentQ?.deBai?.tu || currentQ?.deBai?.nghiaVi || 'Câu hỏi'
            )}
          </div>
        </div>

        {/* Context Card (Ngữ cảnh Tiếng Việt) */}
        <div className={styles.contextCard}>
          <div className={styles.contextHeader}>
            <Icon name="sparkles" size={15} /> NGỮ CẢNH TIẾNG VIỆT
          </div>
          <div className={styles.contextText}>
            {currentQ?.deBai?.dichVi ||
              currentQ?.deBai?.viDuVi ||
              currentQ?.deBai?.goiY ||
              (currentQ?.deBai?.tuLoai ? `Từ loại: [${currentQ.deBai.tuLoai}]` : 'Nhận diện từ và ngữ cảnh câu')}
          </div>
        </div>

        {/* Audio (nếu dạng Nghe Viết) */}
        {currentQ?.loaiCau === 'NGHE_VIET' && (
          <ListenPrompt practiceId={id} questionId={currentQ.id} hasAudio={!!currentQ.deBai?.amTuId} tuLoai={currentQ.deBai?.tuLoai} />
        )}

        {/* Options / Input Content */}
        {activeOptions && Array.isArray(activeOptions) && activeOptions.length > 0 ? (
          <div className={styles.optionsGrid}>
            {activeOptions.map((opt, i) => {
              const letter = LABELS[i] || String.fromCharCode(65 + i);
              const isSelected = currentAnswer === opt.noiDung || currentAnswer === opt.id;
              const hasAnswered = !!currentFb;
              const isOptionCorrect = opt.isCorrect !== undefined ? opt.isCorrect : opt.id === currentQ.dapAnDung;

              let cardClass = styles.optionCard;
              if (hasAnswered) {
                if (isSelected) {
                  cardClass += currentFb.isCorrect ? ` ${styles.optionCardSelected}` : ` ${styles.optionCardWrong}`;
                } else if (isOptionCorrect && (!currentFb.isCorrect || currentAnswer === '__TIMEOUT__')) {
                  cardClass += ` ${styles.optionCardReveal}`;
                }
              }

              return (
                <button
                  key={opt.id || opt.noiDung}
                  type="button"
                  className={cardClass}
                  disabled={hasAnswered || !isTimerActive}
                  onClick={() => handleSelectOption(currentQ.id, opt)}
                >
                  <span className={styles.optionBadge}>{letter}</span>
                  <span className={styles.optionContent}>
                    <span className={styles.optionMain}>{opt.noiDung}</span>
                    {opt.nghiaVi && (
                      <span
                        className={styles.optionSub}
                        style={{ display: hasAnswered ? 'block' : 'none' }}
                      >
                        {opt.nghiaVi}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ) : currentQ?.loaiCau === 'GHEP_TU' && currentQ.deBai?.cotTrai ? (
          <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
            {currentQ.deBai.cotTrai.map((left) => (
              <div
                key={left.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '150px 1fr',
                  gap: '12px',
                  alignItems: 'center',
                  background: '#1a1733',
                  padding: '14px 18px',
                  borderRadius: '12px'
                }}
              >
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#ffffff' }}>{left.noiDung}</div>
                <select
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#231f44',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px'
                  }}
                  value={answers[currentQ.id]?.[left.id] || ''}
                  onChange={(e) => handleInputChange(currentQ.id, e.target.value, left.id)}
                >
                  <option value="">Chọn nghĩa...</option>
                  {currentQ.deBai.cotPhai?.map((right) => (
                    <option key={right.id} value={right.id}>
                      {right.noiDung}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ) : (
          <input
            type="text"
            className={styles.inputBox}
            placeholder={
              currentQ?.loaiCau === 'NGHE_VIET'
                ? 'Nhập từ bạn nghe được...'
                : 'Nhập từ tiếng Anh cần điền vào chỗ trống...'
            }
            value={answers[currentQ?.id] || ''}
            onChange={(e) => handleInputChange(currentQ.id, e.target.value)}
          />
        )}

        {/* Feedback Analysis Area */}
        {currentFb && (
          <div className={styles.analysisGrid} style={{ marginBottom: '20px' }}>
            {!currentFb.isCorrect && (
              <div className={`${styles.analysisItem} ${styles.analysisWrong}`}>
                <div className={`${styles.analysisHead} ${styles.analysisHeadWrong}`}>
                  <Icon name="x" size={18} />
                  {currentFb.isTimeout ? (
                    'HẾT THỜI GIAN (20s)'
                  ) : (
                    <>
                      BẠN ĐÃ CHỌN SAI: <strong>{currentFb.selectedText}</strong>
                    </>
                  )}
                </div>
                {currentFb.selectedMeaning && (
                  <div className={styles.analysisDesc}>Nghĩa: "{currentFb.selectedMeaning}"</div>
                )}
              </div>
            )}

            <div className={`${styles.analysisItem} ${styles.analysisCorrect}`}>
              <div className={`${styles.analysisHead} ${styles.analysisHeadCorrect}`}>
                <Icon name="check" size={18} />
                ĐÁP ÁN ĐÚNG: <strong>{currentFb.correctText}</strong>
              </div>
              {currentFb.correctMeaning && (
                <div className={styles.analysisDesc}>Nghĩa: "{currentFb.correctMeaning}"</div>
              )}
            </div>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div
            style={{
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.15)',
              padding: '12px 18px',
              borderRadius: '10px',
              marginBottom: '16px',
              fontWeight: '500'
            }}
          >
            {submitError}
          </div>
        )}

        {/* Bottom Continue / Submit Button */}
        {currentFb && (
          <button
            type="button"
            className={styles.continueBtn}
            onClick={handleContinue}
            disabled={submitMutation.isPending}
          >
            {isLastQuestion
              ? isRetryMode
                ? 'HOÀN THÀNH LUYỆN LẠI 🏆'
                : 'XEM KẾT QUẢ 🏆'
              : 'TIẾP TỤC ➔'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<div style={{ color: '#ffffff', padding: '60px', textAlign: 'center' }}>Đang tải...</div>}>
      <PracticeSessionContent />
    </Suspense>
  );
}