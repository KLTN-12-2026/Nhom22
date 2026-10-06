'use client';
import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

function PracticeSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const { data: session, isLoading } = useQuery({
    queryKey: ['practice-session', id],
    queryFn: () => apiFetch(`/api/v1/practice/sessions/${id}`),
    enabled: !!id
  });

  const [answers, setAnswers] = useState({});
  const [startTime] = useState(() => Date.now());
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const submitMutation = useMutation({
    mutationFn: (body) => apiFetch(`/api/v1/practice/sessions/${id}/submissions`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      router.push(`/luyen-tap-ket-qua?id=${id}`);
    },
    onError: (err) => alert(err.message || 'Lỗi nộp bài')
  });

  if (!id) return <div>Invalid Session</div>;
  if (isLoading || !session) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải bài...</div>;

  const handleInputChange = (questionId, value, subId = null) => {
    setAnswers(prev => {
      const next = { ...prev };
      if (subId) {
        if (!next[questionId]) next[questionId] = {};
        next[questionId][subId] = value;
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

    submitMutation.mutate({
      submitKey: 'mock-submit-key',
      traLoi,
      thoiGianMs: Date.now() - startTime
    });
  };

  const renderQuestion = (q, index) => {
    const renderContent = () => {
      switch (q.loaiCau) {
        case 'CHON_NGHIA':
          return (
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'var(--font-word)', marginBottom: '4px' }}>{q.deBai.tu}</div>
              <div style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)' }}>
                {q.deBai.phienAm && <span style={{ marginRight: '8px' }}>{q.deBai.phienAm}</span>}
                {q.deBai.tuLoai && <span style={{ color: 'var(--color-primary)' }}>{q.deBai.tuLoai}</span>}
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
        case 'DIEN_CHO_TRONG':
          const sentenceHtml = q.deBai.cau.replace('_____', '<span style="display:inline-block; width:50px; border-bottom:2px solid var(--color-ink); margin:0 4px;"></span>');
          return (
            <div>
              <div style={{ fontSize: '1.25rem', marginBottom: 'var(--space-2)' }} dangerouslySetInnerHTML={{ __html: sentenceHtml }} />
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)' }}>Gợi ý: {q.deBai.goiY} <span style={{ color: 'var(--color-primary)' }}>{q.deBai.tuLoai}</span></div>
              <input type="text" placeholder="Từ cần điền" value={answers[q.id] || ''} onChange={(e) => handleInputChange(q.id, e.target.value)} style={{ width: '100%', padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: '1.1rem' }} />
            </div>
          );
        case 'GHEP_TU':
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
                    {q.deBai.cotPhai.map(right => (
                      <option key={right.id} value={right.id}>{right.noiDung}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          );
        default:
          return <div>Dạng bài này chưa được hỗ trợ mock FE ({q.loaiCau})</div>;
      }
    };

    return (
      <section key={q.id} style={{ display: 'flex', gap: 'var(--space-4)', paddingBottom: 'var(--space-6)', borderBottom: '1px dashed var(--color-border)', marginBottom: 'var(--space-6)' }}>
        <div style={{ width: '40px', height: '40px', background: 'var(--color-field)', border: '2px solid var(--color-primary-tint)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0, color: 'var(--color-primary-strong)' }}>
          {index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'bold', color: 'var(--color-primary)', marginBottom: 'var(--space-3)', textTransform: 'uppercase' }}>
            {q.loaiCau.replace(/_/g, ' ')}
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
          <div style={{ fontWeight: 'bold' }}>Bài luyện ({session.loaiBai})</div>
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
