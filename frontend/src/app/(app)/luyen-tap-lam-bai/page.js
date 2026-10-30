'use client';
import { useState, Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';
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

function BlankSentence({ sentence, mark = '' }) {
  const [before, after] = splitBlank(sentence);
  if (after === null) return before;
  return <>{before}<span style={{ display: 'inline-block', minWidth: '50px', borderBottom: '2px solid var(--color-ink)', margin: '0 4px', textAlign: 'center' }}>{mark}</span>{after}</>;
}

function ListenPrompt({ url, tuLoai }) {
  const [error, setError] = useState('');
  if (!url) return <p className="notice notice-warning" style={{ marginBottom: 'var(--space-3)' }}>Câu này chưa có âm thanh.</p>;
  const listen = (rate) => {
    setError('');
    playAudio(url, rate).catch(() => setError('Trình duyệt chưa phát được âm thanh. Thử lại hoặc kiểm tra loa.'));
  };
  return (
    <div style={{ marginBottom: 'var(--space-3)' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
        <Button type="button" variant="secondary" onClick={() => listen(1)}><Icon name="volume" /> Nghe</Button>
        <Button type="button" variant="ghost" onClick={() => listen(0.6)}>Nghe chậm</Button>
      </div>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginTop: 'var(--space-2)' }}>
        {tuLoai && <>Từ loại <span style={{ color: 'var(--color-primary)' }}>[{tuLoai}]</span>, </>}nghe bao nhiêu lần cũng được
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

  const [answers, setAnswers] = useState({});
  const [timer, setTimer] = useState(0);
  const [submitError, setSubmitError] = useState('');

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

  if (!id) return <div>Invalid Session</div>;
  if (error) return <div className="notice notice-danger" role="alert" style={{ margin: 'var(--space-6)' }}>{error.message || 'Chưa tải được bài luyện.'}</div>;
  if (isLoading || !session) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải bài...</div>;

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

  const calculateAnswered = () => {
    return session.cauHoi.filter(q => {
      const ans = answers[q.id];
      if (q.loaiCau === 'GHEP_TU') {
        if (!ans) return false;
        return q.deBai.cotTrai.every(l => !!ans[l.id]);
      }
      if (q.phuongAn) return !!ans;
      return !!ans && String(ans).trim() !== '';
    }).length;
  };

  const answeredCount = calculateAnswered();
  const progressPercent = session.cauHoi.length ? (answeredCount / session.cauHoi.length) * 100 : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (answeredCount < session.cauHoi.length) {
      if (!window.confirm(`Còn ${session.cauHoi.length - answeredCount} câu trống. Bạn có chắc chắn muốn nộp?`)) return;
    }

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
      thoiGianMs: now() - startRef.current
    });
  };

  const renderQuestion = (q, index) => {
    const renderContent = () => {
      if (q.phuongAn && Array.isArray(q.phuongAn)) {
        return (
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', fontFamily: 'var(--font-word)', marginBottom: '4px' }}>
              {q.deBai?.tu || q.deBai?.nghiaVi || (q.deBai?.cau ? <BlankSentence sentence={q.deBai.cau} /> : null)}
            </div>
            <div style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-sm)' }}>
              {q.deBai?.phienAm && <span style={{ marginRight: '8px' }}>{q.deBai.phienAm}</span>}
              {q.deBai?.tuLoai && <span style={{ color: 'var(--color-primary)' }}>[{q.deBai.tuLoai}]</span>}
              {q.deBai?.goiY && <span style={{ marginLeft: '8px' }}>Gợi ý: {q.deBai.goiY}</span>}
            </div>
            <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
              {q.phuongAn.map((opt, i) => (
                <label key={opt.id} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 'var(--space-3)', cursor: 'pointer', background: answers[q.id] === opt.id ? 'var(--color-primary-tint)' : 'transparent' }}>
                  <input type="radio" name={q.id} value={opt.id} checked={answers[q.id] === opt.id} onChange={(e) => handleInputChange(q.id, e.target.value)} />
                  <span style={{ fontWeight: 'bold', width: '20px' }}>{String.fromCharCode(65 + i)}</span>
                  <span>{opt.noiDung}</span>
                </label>
              ))}
            </div>
          </div>
        );
      }

      if (q.loaiCau === 'GHEP_TU' && q.deBai?.cotTrai) {
        return (
          <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
            {q.deBai.cotTrai.map(left => (
              <div key={left.id} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 'var(--space-3)', alignItems: 'center' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{left.noiDung}</div>
                <select
                  style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
                  value={answers[q.id]?.[left.id] || ''}
                  onChange={(e) => handleInputChange(q.id, e.target.value, left.id)}
                >
                  <option value="">Chọn nghĩa...</option>
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
      return (
        <div>
          {listening ? (
            <ListenPrompt url={q.deBai?.amThanhUrl} tuLoai={q.deBai?.tuLoai} />
          ) : q.deBai?.cau ? (
            <div style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }}><BlankSentence sentence={q.deBai.cau} /></div>
          ) : (
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: 'var(--space-2)' }}>{q.deBai?.nghiaVi || q.deBai?.tu}</div>
          )}
          {!listening && (
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)' }}>
              Gợi ý: {q.deBai?.goiY || 'Gõ từ tiếng Anh chuẩn xác'} {q.deBai?.phienAm && <span>({q.deBai.phienAm})</span>} {q.deBai?.tuLoai && <span style={{ color: 'var(--color-primary)' }}>[{q.deBai.tuLoai}]</span>}
              {q.deBai?.viDuVi && <div style={{ marginTop: '4px' }}>Ví dụ: {q.deBai.viDuVi}</div>}
            </div>
          )}
          <input
            type="text"
            placeholder={listening ? 'Từ bạn nghe được' : 'Nhập từ tiếng Anh...'}
            value={answers[q.id] || ''}
            onChange={(e) => handleInputChange(q.id, e.target.value)}
            style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '1.1rem' }}
          />
        </div>
      );
    };

    return (
      <section key={q.id} style={{ display: 'flex', gap: 'var(--space-4)', paddingBottom: 'var(--space-6)', borderBottom: '1px dashed var(--color-border)', marginBottom: 'var(--space-6)' }}>
        <div style={{ width: '40px', height: '40px', background: 'var(--color-field)', border: '2px solid var(--color-primary-tint)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, color: 'var(--color-primary-strong)' }}>
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: 'var(--space-3)', textTransform: 'uppercase' }}>
            {label(PRACTICE_TYPE, q.loaiCau)}
          </div>
          {renderContent()}
        </div>
      </section>
    );
  };

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'var(--color-field)', display: 'flex', alignItems: 'center', padding: 'var(--space-2) var(--space-4)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Button variant="ghost" onClick={() => router.push('/luyen-tap')} style={{ padding: '8px' }}><Icon name="x" /></Button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>Bài luyện: {label(PRACTICE_TYPE, session.loaiBai)}</div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>{session.boTheTen}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', fontWeight: 'bold' }}>
          <Icon name="clock" /> {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
        </div>
      </header>
      <div style={{ height: '4px', background: 'var(--color-border)' }}>
        <div style={{ height: '100%', background: 'var(--color-primary)', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
      </div>

      <main style={{ flex: 1, padding: 'var(--space-5)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '720px' }}>
          <form onSubmit={handleSubmit} style={{ background: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-4)' }}>
              <h1 style={{ fontSize: 'var(--font-size-2xl)' }}>Bài luyện</h1>
              <p style={{ color: 'var(--color-ink-2)' }}>Trả lời theo thứ tự nào cũng được. Không phân biệt chữ hoa, chữ thường.</p>
            </div>

            <div>
              {session.cauHoi.map((q, index) => renderQuestion(q, index))}
            </div>

            {submitError && <p className="notice notice-danger" role="alert" style={{ marginTop: 'var(--space-4)' }}>{submitError}</p>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-6)', position: 'sticky', bottom: 'var(--space-4)', background: 'var(--color-field)', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontWeight: 'bold' }}>Đã trả lời {answeredCount}/{session.cauHoi.length}</div>
              <Button type="submit" variant="primary" size="lg" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'Đang nộp...' : 'Nộp bài'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <PracticeSessionContent />
    </Suspense>
  );
}
