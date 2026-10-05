'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

function FlashcardSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const queryClient = useQueryClient();

  const [flipped, setFlipped] = useState(false);
  const [queueDraft, setQueue] = useState(null);


  const { data, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => apiFetch(`/api/v1/learning/sessions/${id}`),
    enabled: !!id
  });

  const session = data;
  const queue = queueDraft ?? data?.hangDoi ?? [];


  const reviewMutation = useMutation({
    mutationFn: (body) => apiFetch(`/api/v1/learning/sessions/${id}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
  });

  const finishMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/learning/sessions/${id}/finish`, { method: 'POST' }),
    onSuccess: () => {
      router.push(`/hom-nay`);
    }
  });

  if (!id) return <div>Invalid Session</div>;
  if (isLoading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải phiên học...</div>;
  if (error || !session) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Lỗi tải phiên học.</div>;

  const currentItem = queue.find(q => q.trangThai === 'CHO' && (!q.tienDo.hanOnAt || new Date(q.tienDo.hanOnAt) <= new Date()));
  const realItems = queue.filter(q => q.the);
  const doneCount = realItems.filter(q => q.trangThai === 'DA_ON').length;
  const progressPercent = realItems.length ? (doneCount / realItems.length) * 100 : 0;

  const handleFlip = () => {
    setFlipped(true);
  };

  const handleRate = async (rate) => {
    if (!currentItem) return;
    try {
      const res = await reviewMutation.mutateAsync({
        theId: currentItem.theId,
        chieuHoc: session.chieuHoc,
        danhGia: rate,
        expectedVersion: currentItem.tienDo.version,
        thoiGianTraLoiMs: 1500
      });

      const newQueue = [...queue];
      const index = newQueue.findIndex(q => q.theId === currentItem.theId && q.trangThai === 'CHO');
      if (index !== -1) {
        newQueue[index].trangThai = 'DA_ON';
        newQueue[index].tienDo = res.tienDo;
      }

      if (res.laiTrongPhien) {
        newQueue.push({
          theId: currentItem.theId,
          thuTu: newQueue.length + 1,
          trangThai: 'CHO',
          tienDo: res.tienDo,
          duKien: res.duKien,
          the: currentItem.the
        });
      }

      setQueue(newQueue);
      setFlipped(false);

      const remaining = newQueue.filter(q => q.trangThai === 'CHO');
      if (remaining.length === 0) {
        finishMutation.mutate();
      }
    } catch (err) {
      alert(err.message || 'Lỗi khi lưu kết quả');
    }
  };

  const renderFront = () => {
    if (!currentItem) return null;
    const the = currentItem.the;
    if (session.chieuHoc === 'EN_VI') {
      return (
        <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>Mặt trước, nhớ lại nghĩa</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'var(--font-word)' }}>{the.tu}</div>
          {the.phienAm && <div style={{ fontSize: '1.2rem', color: 'var(--color-ink-2)', fontFamily: 'var(--font-word)' }}>{the.phienAm}</div>}
          {the.tuLoai && <div style={{ fontSize: '1rem', color: 'var(--color-primary-strong)', fontStyle: 'italic', marginTop: 'var(--space-1)' }}>{the.tuLoai}</div>}
        </div>
      );
    } else {
      return (
        <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>Mặt trước, nhớ lại từ tiếng Anh</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{the.nghiaVi}</div>
          {the.tuLoai && <div style={{ fontSize: '1rem', color: 'var(--color-primary-strong)', fontStyle: 'italic', marginTop: 'var(--space-1)' }}>{the.tuLoai}</div>}
        </div>
      );
    }
  };

  const renderBack = () => {
    if (!currentItem) return null;
    const the = currentItem.the;
    if (session.chieuHoc === 'EN_VI') {
      return (
        <div style={{ textAlign: 'center', padding: 'var(--space-6) 0', borderTop: '1px dashed var(--color-primary-line)', marginTop: 'var(--space-4)', animation: 'reveal 0.3s ease-out' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>Mặt sau</div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{the.nghiaVi}</div>
          {the.viDuEn && <div style={{ marginTop: 'var(--space-4)', fontStyle: 'italic' }}>“{the.viDuEn}”</div>}
        </div>
      );
    } else {
      return (
        <div style={{ textAlign: 'center', padding: 'var(--space-6) 0', borderTop: '1px dashed var(--color-primary-line)', marginTop: 'var(--space-4)', animation: 'reveal 0.3s ease-out' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)', fontWeight: 'bold', marginBottom: 'var(--space-4)' }}>Mặt sau</div>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'var(--font-word)' }}>{the.tu}</div>
          {the.phienAm && <div style={{ fontSize: '1.2rem', color: 'var(--color-ink-2)', fontFamily: 'var(--font-word)' }}>{the.phienAm}</div>}
          {the.viDuEn && <div style={{ marginTop: 'var(--space-4)', fontStyle: 'italic' }}>“{the.viDuEn}”</div>}
        </div>
      );
    }
  };

  return (
    <div style={{ background: 'var(--color-bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: 'var(--color-field)', display: 'flex', alignItems: 'center', padding: 'var(--space-2) var(--space-4)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <Button variant="ghost" onClick={() => router.push('/hom-nay')} style={{ padding: '8px' }}><Icon name="x" /></Button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold' }}>{session.boTheTen}</div>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>{doneCount} / {realItems.length} thẻ</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)' }}>
          <Icon name="clock" /> --:--
        </div>
      </header>
      <div style={{ height: '4px', background: 'var(--color-border)' }}>
        <div style={{ height: '100%', background: 'var(--color-primary)', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
      </div>

      <main style={{ flex: 1, padding: 'var(--space-4) var(--space-2)', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column' }}>
          {currentItem ? (
            <div style={{ background: 'var(--color-field)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', padding: 'var(--space-6)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ flex: 1 }}>
                {renderFront()}
                {flipped && renderBack()}
              </div>

              <div style={{ marginTop: 'var(--space-6)', position: 'sticky', bottom: 'var(--space-4)' }}>
                {!flipped ? (
                  <Button variant="primary" size="lg" style={{ width: '100%', fontSize: '1.2rem', padding: 'var(--space-3)' }} onClick={handleFlip}>
                    Lật thẻ (Space)
                  </Button>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-2)' }}>
                    <Button variant="secondary" onClick={() => handleRate('QUEN')} disabled={reviewMutation.isPending} style={{ height: '80px', display: 'flex', flexDirection: 'column', padding: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 'bold' }}>1 - Quên</span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)' }}>{currentItem.duKien?.QUEN || '<1m'}</span>
                    </Button>
                    <Button variant="secondary" onClick={() => handleRate('KHO')} disabled={reviewMutation.isPending} style={{ height: '80px', display: 'flex', flexDirection: 'column', padding: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 'bold' }}>2 - Khó</span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)' }}>{currentItem.duKien?.KHO || '5m'}</span>
                    </Button>
                    <Button variant="secondary" onClick={() => handleRate('NHO')} disabled={reviewMutation.isPending} style={{ height: '80px', display: 'flex', flexDirection: 'column', padding: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 'bold' }}>3 - Nhớ</span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)' }}>{currentItem.duKien?.NHO || '1d'}</span>
                    </Button>
                    <Button variant="secondary" onClick={() => handleRate('DE')} disabled={reviewMutation.isPending} style={{ height: '80px', display: 'flex', flexDirection: 'column', padding: 'var(--space-2)' }}>
                      <span style={{ fontWeight: 'bold' }}>4 - Dễ</span>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)' }}>{currentItem.duKien?.DE || '4d'}</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--color-field)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)', textAlign: 'center' }}>
              <h2 style={{ marginBottom: 'var(--space-4)' }}>Đang đợi thẻ tiếp theo...</h2>
              <Button variant="primary" onClick={() => finishMutation.mutate()}>Kết thúc phiên ngay</Button>
            </div>
          )}
        </div>
      </main>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes reveal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}

export default function FlashcardSessionPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <FlashcardSessionContent />
    </Suspense>
  );
}
