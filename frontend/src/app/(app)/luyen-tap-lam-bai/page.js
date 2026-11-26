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

const now = () => Date.now();

const HINI_TIME_LIMIT = 20;
const HINI_LABELS = ['A', 'B', 'C', 'D'];

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

  const questionOptionsMap = useMemo(() => {
    if (!session?.cauHoi) return {};
    const map = {};
    const allCards = session.cauHoi
      .map(q => ({
        tu: q.deBai?.tu || q.deBai?.tuGoc || '',
        nghiaVi: q.deBai?.goiY || q.deBai?.dichVi || ''
      }))
      .filter(c => c.tu);

    session.cauHoi.forEach(q => {
      if (q.phuongAn && Array.isArray(q.phuongAn) && q.phuongAn.length > 0) {
        map[q.id] = q.phuongAn;
        return;
      }

      const targetWord = q.deBai?.tu || q.deBai?.tuGoc || '';
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

  const handleTimeout = () => {
    if (!currentQ || answers[currentQ.id]) return;
    SFX.timeup();
    const qId = currentQ.id;
    setAnswers((prev) => ({ ...prev, [qId]: '__TIMEOUT__' }));

    const targetWord = currentQ.deBai?.tu || currentQ.deBai?.tuGoc || '';
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
        correctMeaning: targetMeaning
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
    const targetWord = currentQ.deBai?.tu || currentQ.deBai?.tuGoc || currentQ.dapAnText || opt.noiDung;
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
        correctMeaning: targetMeaning
      }
    }));
  };

  const handleSubmitSession = () => {
    const originalQuestions = session?.cauHoi || [];
    const traLoi = originalQuestions.map((q) => {
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

    let highlightClass = styles.hiniBlankHighlight;
    if (isAnswered) {
      highlightClass += isCorr ? ` ${styles.hiniBlankHighlightCorrect}` : ` ${styles.hiniBlankHighlightWrong}`;
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

  const activeOptions = currentQ ? (questionOptionsMap[currentQ.id] || currentQ.phuongAn) : [];

  if (isFinished) {
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    const emoji = accuracy >= 90 ? '🏆' : accuracy >= 70 ? '⭐' : '📚';
    const titleText = accuracy >= 90 ? 'Xuất Sắc!' : accuracy >= 70 ? 'Khá Tốt!' : 'Cần Cố Gắng Thêm!';

    return (
      <div className={styles.hiniContainer}>
        <div className={styles.hiniWrapper}>
          <div className={styles.hiniEndScreen}>
            <span className={styles.hiniEndEmoji}>{emoji}</span>
            <h2 className={styles.hiniEndTitle}>{titleText}</h2>
            <p className={styles.hiniEndScore}>
              Bạn trả lời đúng {correctCount}/{total} câu · Điểm: {score} · Độ chính xác: {accuracy}%
            </p>

            <div className={styles.hiniRetryActions}>
              {wrongQuestions.length > 0 && (
                <button type="button" className={styles.hiniBtnGold} onClick={handleStartRetry}>
                  🔄 LUYỆN LẠI CÂU SAI ({wrongQuestions.length} CÂU)
                </button>
              )}
              <button type="button" className={styles.hiniBtnOutline} onClick={handleRestartAll}>
                ↻ LÀM LẠI TỪ ĐẦU
              </button>
              <button
                type="button"
                className={styles.hiniBtnSecondaryAction}
                onClick={() => router.push(`/luyen-tap-ket-qua?id=${id}`)}
              >
                📊 XEM BÁO CÁO CHI TIẾT
              </button>
              <Link href="/luyen-tap" className={styles.hiniBtnExitEnd}>
                Quay về trang Luyện tập
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.hiniContainer}>
      <div className={styles.hiniWrapper}>
        <div className={styles.hiniTopBar}>
          <Link href="/luyen-tap" className={styles.hiniExitBtn}>
            <Icon name="arrow-left" size={16} /> Thoát
          </Link>

          <div className={styles.hiniBrandCenter}>
            <div className={styles.hiniBrandTitle}>
              {isRetryMode ? 'LUYỆN LẠI CÂU SAI 🔄' : (session.boTheTen || 'Điền Chỗ Trống')}
            </div>
            <div className={styles.hiniBrandSub}>Dạng bài: Điền chỗ trống (HINI 20s)</div>
          </div>

          <div className={styles.hiniStatCards}>
            <div className={styles.hiniStatCard}>
              <span className={styles.hiniStatNum}>{score}</span>
              <span className={styles.hiniStatLabel}>ĐIỂM</span>
            </div>
            <div className={styles.hiniStatCard}>
              <span className={styles.hiniStatNum}>{correctCount}</span>
              <span className={styles.hiniStatLabel}>CÂU ĐÚNG</span>
            </div>
          </div>
        </div>

        {isRetryMode && (
          <div style={{ textAlign: 'center' }}>
            <span className={styles.hiniRetryBadge}>
              <Icon name="sparkles" size={13} /> Đang luyện lại các câu chưa đúng
            </span>
          </div>
        )}

        <div className={styles.hiniTimelineRow}>
          <span className={`${styles.hiniTimeDisplay} ${timeLeft <= 5 ? styles.hiniTimeDisplayDanger : ''}`}>
            {timeLeft}s
          </span>
          <div className={styles.hiniProgressTrack}>
            <div
              className={`${styles.hiniProgressFill} ${timeLeft <= 5 ? styles.hiniProgressFillDanger : ''}`}
              style={{ width: `${(timeLeft / HINI_TIME_LIMIT) * 100}%` }}
            />
          </div>
        </div>

        <div className={styles.hiniQuestionCard}>
          <span className={styles.hiniQuestionTag}>
            QUESTION {currentIndex + 1} / {total}
          </span>
          <div className={styles.hiniQuestionSentence}>
            {currentQ?.deBai?.cau ? (
              renderSentenceWithBlank(currentQ.deBai.cau)
            ) : (
              currentQ?.deBai?.tu || currentQ?.deBai?.nghiaVi || 'Câu hỏi'
            )}
          </div>
        </div>

        <div className={styles.hiniContextCard}>
          <div className={styles.hiniContextHeader}>
            <Icon name="sparkles" size={15} /> NGỮ CẢNH TIẾNG VIỆT
          </div>
          <div className={styles.hiniContextText}>
            {currentQ?.deBai?.dichVi ||
              currentQ?.deBai?.viDuVi ||
              currentQ?.deBai?.goiY ||
              (currentQ?.deBai?.tuLoai ? `Từ loại: [${currentQ.deBai.tuLoai}]` : 'Nhận diện từ và ngữ cảnh câu')}
          </div>
        </div>

        {activeOptions && Array.isArray(activeOptions) && activeOptions.length > 0 && (
          <div className={styles.hiniOptionsGrid}>
            {activeOptions.map((opt, i) => {
              const letter = HINI_LABELS[i] || String.fromCharCode(65 + i);
              const isSelected = currentAnswer === opt.noiDung || currentAnswer === opt.id;
              const hasAnswered = !!currentFb;
              const isOptionCorrect = opt.isCorrect !== undefined ? opt.isCorrect : opt.id === currentQ.dapAnDung;

              let cardClass = styles.hiniOptionCard;
              if (hasAnswered) {
                if (isSelected) {
                  cardClass += currentFb.isCorrect ? ` ${styles.hiniOptionCardSelected}` : ` ${styles.hiniOptionCardWrong}`;
                } else if (isOptionCorrect && (!currentFb.isCorrect || currentAnswer === '__TIMEOUT__')) {
                  cardClass += ` ${styles.hiniOptionCardReveal}`;
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
                  <span className={styles.hiniOptionBadge}>{letter}</span>
                  <span className={styles.hiniOptionContent}>
                    <span className={styles.hiniOptionMain}>{opt.noiDung}</span>
                    {opt.nghiaVi && (
                      <span
                        className={styles.hiniOptionSub}
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
        )}

        {currentFb && (
          <div className={styles.hiniAnalysisGrid} style={{ marginBottom: '20px' }}>
            {!currentFb.isCorrect && (
              <div className={`${styles.hiniAnalysisItem} ${styles.hiniAnalysisWrong}`}>
                <div className={`${styles.hiniAnalysisHead} ${styles.hiniAnalysisHeadWrong}`}>
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
                  <div className={styles.hiniAnalysisDesc}>Nghĩa: "{currentFb.selectedMeaning}"</div>
                )}
              </div>
            )}

            <div className={`${styles.hiniAnalysisItem} ${styles.hiniAnalysisCorrect}`}>
              <div className={`${styles.hiniAnalysisHead} ${styles.hiniAnalysisHeadCorrect}`}>
                <Icon name="check" size={18} />
                ĐÁP ÁN ĐÚNG: <strong>{currentFb.correctText}</strong>
              </div>
              {currentFb.correctMeaning && (
                <div className={styles.hiniAnalysisDesc}>Nghĩa: "{currentFb.correctMeaning}"</div>
              )}
            </div>
          </div>
        )}

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

        {currentFb && (
          <button
            type="button"
            className={styles.hiniContinueBtn}
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

function MatchingGameView({ session, id }) {
  const router = useRouter();
  const startRef = useRef(0);
  const submitKey = useRef('');

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
  const [floatingScores, setFloatingScores] = useState([]);
  const [toast, setToast] = useState('');

  const ROUND_TIME = 45;
  const [timeLeft, setTimeLeft] = useState(ROUND_TIME);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const currentQ = questions[roundIndex] || questions[0];
  const totalPairsCount = useMemo(() => {
    return questions.reduce((sum, q) => sum + (q.deBai?.cotTrai?.length || 0), 0);
  }, [questions]);

  useEffect(() => {
    startRef.current = now();
  }, []);

  const submitMutation = useMutation({
    mutationFn: (body) =>
      apiFetch(`/api/v1/practice/sessions/${id}/submissions`, {
        method: 'POST',
        body: JSON.stringify(body)
      }),
    onError: (err) => {
      if (err.status === 409) return;
      setSubmitError(err.message || 'Chưa nộp được bài lên hệ thống.');
    }
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2200);
  };

  const playCustomTone = (freq, type = 'sine', duration = 0.15, vol = 0.1) => {
    if (!soundEnabled) return;
    playTone(freq, type, duration, vol);
  };

  const playSuccessSound = () => {
    if (!soundEnabled) return;
    playTone(523.25, 'triangle', 0.12, 0.15);
    setTimeout(() => playTone(659.25, 'triangle', 0.12, 0.15), 90);
    setTimeout(() => playTone(783.99, 'triangle', 0.25, 0.2), 180);
  };

  const playErrorSound = () => {
    if (!soundEnabled) return;
    playTone(220, 'sawtooth', 0.15, 0.12);
    setTimeout(() => playTone(180, 'sawtooth', 0.2, 0.12), 120);
  };

  const speakEnglish = (word) => {
    if (!soundEnabled || !word) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(word);
        utter.lang = 'en-US';
        utter.rate = 0.95;
        window.speechSynthesis.speak(utter);
      } catch {}
    }
  };

  useEffect(() => {
    if (!currentQ || !currentQ.deBai) return;
    const cotTrai = currentQ.deBai.cotTrai || [];
    const cotPhai = currentQ.deBai.cotPhai || [];

    const list = [];
    cotTrai.forEach((t) => {
      list.push({
        uid: `en_${currentQ.id}_${t.id}`,
        id: t.id,
        text: t.noiDung,
        type: 'en',
        maCap: t.maCap || t.id,
        speakText: t.noiDung
      });
    });
    cotPhai.forEach((n) => {
      list.push({
        uid: `vi_${currentQ.id}_${n.id}`,
        id: n.id,
        text: n.noiDung,
        type: 'vi',
        maCap: n.maCap || n.id,
        speakText: ''
      });
    });

    setRoundCards(shuffle(list));
    setSelectedCards([]);
    setCorrectUids(new Set());
    setWrongUids(new Set());
    setMatchedUids(new Set());
    setTimeLeft(ROUND_TIME);
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
        if (prev <= 10 && soundEnabled) {
          playTone(800, 'sine', 0.05, 0.04);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isFinished, soundEnabled]);

  const handleSubmitSession = (finalAnswers = answers) => {
    const traLoi = questions.map((q) => {
      const capList = finalAnswers[q.id] || [];
      return { cauHoiId: q.id, cap: capList };
    });

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

  const triggerFloatingScore = (e, text) => {
    const rect = e?.currentTarget?.getBoundingClientRect?.() || { left: 200, top: 200, width: 60 };
    const newPopup = {
      id: Date.now() + Math.random(),
      x: rect.left + rect.width / 2 - 15,
      y: rect.top,
      text
    };
    setFloatingScores((prev) => [...prev, newPopup]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((p) => p.id !== newPopup.id));
    }, 800);
  };

  const handleCardClick = (card, e) => {
    if (isPaused || timeLeft <= 0 || isFinished) return;
    if (matchedUids.has(card.uid) || correctUids.has(card.uid)) return;

    if (selectedCards.some((c) => c.uid === card.uid)) {
      setSelectedCards((prev) => prev.filter((c) => c.uid !== card.uid));
      return;
    }

    if (selectedCards.length >= 2) return;

    const newSelected = [...selectedCards, card];
    setSelectedCards(newSelected);
    playCustomTone(card.type === 'en' ? 440 : 380, 'sine', 0.08, 0.06);

    if (newSelected.length === 2) {
      const [cardA, cardB] = newSelected;
      const isMatch = cardA.maCap === cardB.maCap && cardA.type !== cardB.type;

      if (isMatch) {
        setCorrectUids((prev) => new Set([...prev, cardA.uid, cardB.uid]));
        playSuccessSound();

        const enCard = cardA.type === 'en' ? cardA : cardB;
        const viCard = cardA.type === 'vi' ? cardA : cardB;
        speakEnglish(enCard.speakText);

        setScore((prev) => prev + 25);
        setPairsMatched((prev) => prev + 1);
        setTimeLeft((prev) => Math.min(ROUND_TIME, prev + 3));
        triggerFloatingScore(e, '+25');

        const pairObj = { traiId: enCard.id, phaiId: viCard.id };
        const updatedAnswers = {
          ...answers,
          [currentQ.id]: [...(answers[currentQ.id] || []), pairObj]
        };
        setAnswers(updatedAnswers);

        setTimeout(() => {
          setMatchedUids((prev) => {
            const next = new Set([...prev, cardA.uid, cardB.uid]);
            if (next.size >= roundCards.length && roundCards.length > 0) {
              if (roundIndex + 1 < questions.length) {
                showToast('🎉 Xuất sắc! Nạp vòng tiếp theo (+50 điểm)...');
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
        setWrongUids(new Set([cardA.uid, cardB.uid]));
        playErrorSound();
        setTimeout(() => {
          setSelectedCards([]);
          setWrongUids(new Set());
        }, 500);
      }
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
    setTimeLeft(ROUND_TIME);
    setIsPaused(false);
    setIsFinished(false);
    setSubmitError('');
    startRef.current = now();
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <div className={styles.matchContainer}>
      <div className={styles.matchWrapper}>
        <div className={styles.matchHeader}>
          <div className={styles.matchTitleGroup}>
            <Link href="/luyen-tap" className={styles.matchBackBtn} title="Quay lại">
              <Icon name="arrow-left" size={16} /> Thoát
            </Link>
            <div className={styles.matchPuzzleIcon}>🧩</div>
            <div className={styles.matchTitleTexts}>
              <h1>{session.boTheTen || 'Nối Từ'}</h1>
              <p>Chạm từ tiếng Anh và nghĩa tiếng Việt tương ứng để nối cặp</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.matchToolBtn}
            onClick={toggleFullScreen}
            title="Toàn màn hình"
          >
            ⛶
          </button>
        </div>

        <div className={styles.matchStatusBar}>
          <div className={styles.matchTimerContainer}>
            <span className={styles.matchTimerIcon}>⏱️</span>
            <div className={styles.matchTimerTrack}>
              <div
                className={`${styles.matchTimerFill} ${timeLeft <= 10 ? styles.matchTimerFillDanger : ''}`}
                style={{ width: `${Math.max(0, (timeLeft / ROUND_TIME) * 100)}%` }}
              />
            </div>
            <span
              className={`${styles.matchTimerText} ${timeLeft <= 10 ? styles.matchTimerTextDanger : ''}`}
            >
              {timeLeft}s
            </span>
          </div>

          <div className={styles.matchScoreBadge}>
            <span>🏆</span>
            <span>{score}</span>
          </div>

          {questions.length > 1 && (
            <div className={styles.matchRoundBadge}>
              Vòng {roundIndex + 1}/{questions.length}
            </div>
          )}

          <button
            type="button"
            className={styles.matchToolBtn}
            onClick={() => {
              setSoundEnabled((prev) => !prev);
              showToast(!soundEnabled ? 'Đã bật âm thanh 🔊' : 'Đã tắt âm thanh 🔇');
            }}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>

          <button
            type="button"
            className={styles.matchToolBtn}
            onClick={() => {
              setIsPaused((prev) => !prev);
              showToast(!isPaused ? 'Đã tạm dừng ⏸' : 'Tiếp tục ▶');
            }}
            title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
        </div>

        <div className={styles.matchBoard}>
          <div className={styles.matchCardsGrid}>
            {roundCards.map((card) => {
              const isSelected = selectedCards.some((c) => c.uid === card.uid);
              const isCorrect = correctUids.has(card.uid);
              const isWrong = wrongUids.has(card.uid);
              const isMatched = matchedUids.has(card.uid);

              let cardClass = `${styles.matchCard} ${card.type === 'en' ? styles.matchCardEn : styles.matchCardVi}`;
              if (isSelected) cardClass += ` ${styles.matchCardSelected}`;
              if (isCorrect) cardClass += ` ${styles.matchCardCorrect}`;
              if (isWrong) cardClass += ` ${styles.matchCardWrong}`;
              if (isMatched) cardClass += ` ${styles.matchCardMatched}`;

              return (
                <div
                  key={card.uid}
                  className={cardClass}
                  onClick={(e) => handleCardClick(card, e)}
                >
                  <span className={styles.matchCardTag}>
                    {card.type === 'en' ? 'Aa' : '•••'}
                  </span>
                  <span>{card.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {floatingScores.map((item) => (
          <div
            key={item.id}
            className={styles.matchFloatingScore}
            style={{ left: `${item.x}px`, top: `${item.y}px` }}
          >
            {item.text}
          </div>
        ))}

        {toast && <div className={styles.matchToast}>{toast}</div>}

        {submitError && (
          <div
            style={{
              color: '#ef4444',
              background: 'rgba(239, 68, 68, 0.15)',
              padding: '12px 18px',
              borderRadius: '10px',
              fontWeight: '500'
            }}
          >
            {submitError}
          </div>
        )}

        {isFinished && (
          <div className={styles.matchModalOverlay}>
            <div className={styles.matchGameOverBox}>
              <div className={styles.matchModalEmoji}>
                {pairsMatched >= totalPairsCount && totalPairsCount > 0 ? '🏆' : timeLeft <= 0 ? '⏱️' : '⭐'}
              </div>
              <h2 className={styles.matchModalTitle}>
                {timeLeft <= 0 ? 'Hết giờ!' : 'Hoàn thành xuất sắc!'}
              </h2>

              <div className={styles.matchStatsRow}>
                <div className={styles.matchStatBox}>
                  <span className={styles.matchStatNumber}>{score}</span>
                  <span className={styles.matchStatLabel}>ĐIỂM</span>
                </div>
                <div className={styles.matchStatBox}>
                  <span className={styles.matchStatNumber}>
                    {pairsMatched}/{totalPairsCount}
                  </span>
                  <span className={styles.matchStatLabel}>CẶP TỪ</span>
                </div>
              </div>

              <div className={styles.matchModalActions}>
                <button
                  type="button"
                  className={styles.matchBtnReplay}
                  onClick={handleRestart}
                >
                  🔄 Chơi lại
                </button>
                <Link
                  href={`/luyen-tap-ket-qua?id=${id}`}
                  className={styles.matchBtnReport}
                >
                  📊 Xem báo cáo chi tiết
                </Link>
                <Link href="/luyen-tap" className={styles.matchBtnExit}>
                  ✕ Thoát
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BlankSentence({ sentence, mark = '' }) {
  const [before, after] = splitBlank(sentence);
  if (after === null) return before;
  return <>{before}<span className={styles.blank}>{mark}</span>{after}</>;
}

function ListenPrompt({ practiceId, questionId, hasAudio, tuLoai, word }) {
  const [error, setError] = useState('');
  const [loadingAudio, setLoadingAudio] = useState(false);
  const cached = useRef(null);

  const listen = (rate = 1) => {
    setError('');
    if (word && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(word);
        utter.lang = 'en-US';
        utter.rate = rate;
        window.speechSynthesis.speak(utter);
        return;
      } catch {}
    }

    if (!hasAudio && !word) {
      setError('Câu này chưa có âm thanh.');
      return;
    }

    setLoadingAudio(true);
    const audioUrl = async () => {
      const c = cached.current;
      if (c && (!c.expiresAt || new Date(c.expiresAt).getTime() - 30000 > now())) return c.downloadUrl;
      const file = await apiFetch(`/api/v1/practice/sessions/${practiceId}/questions/${questionId}/audio`);
      cached.current = file;
      return file.downloadUrl;
    };
    audioUrl()
      .then((url) => playAudio(url, rate))
      .catch((err) => {
        cached.current = null;
        setError(err.message || 'Không tải được âm thanh. Thử lại.');
      })
      .finally(() => setLoadingAudio(false));
  };

  const isAvailable = hasAudio || !!word;
  if (!isAvailable) return <p className="notice notice-warning">Câu này chưa có âm thanh.</p>;

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
          hasAudio={!!(q.deBai?.amTuId || q.deBai?.amThanhTts || q.deBai?.tu)}
          tuLoai={q.deBai?.tuLoai}
          word={q.deBai?.tu}
        />
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
