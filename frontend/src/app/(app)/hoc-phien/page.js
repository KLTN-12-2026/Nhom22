'use client';
import { SpeakButton } from '@/components/content/SpeakButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

function FlashcardSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const flipButton = useRef(null);
  const rateButtons = useRef([]);

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

  useEffect(() => {
    function onKeyDown(event) {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey ||
        event.target.closest('input, textarea, select, button, a, [contenteditable="true"], dialog')) return;
      const button = event.code === 'Space' ? flipButton.current : rateButtons.current[Number(event.key) - 1];
      if (button && !button.disabled) { event.preventDefault(); button.click(); }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
    if (!currentItem || !flipped || reviewMutation.isPending) return;
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


  const the = currentItem?.the;
  const englishFront = session.chieuHoc === 'EN_VI';
  const ratings = [['QUEN', 'Quên'], ['KHO', 'Khó'], ['NHO', 'Nhớ'], ['DE', 'Dễ']];

  return (
    <div className="session">
      <header className="session-bar">
        <Button variant="ghost" className="btn-icon" aria-label="Rời phiên học" onClick={() => router.push('/hom-nay')}><Icon name="x" /></Button>
        <div className="grow">
          <p className="bar-title">{session.boTheTen}</p>
          <p className="bar-sub">{englishFront ? 'Anh → Việt' : 'Việt → Anh'}<span>{doneCount} / {realItems.length} thẻ</span></p>
        </div>
        <span className="stamp" role="status">{reviewMutation.isPending ? 'Đang lưu…' : 'Đã tải phiên học'}</span>
      <ThemeToggle className="theme-session" /></header>
      <div className="meter is-progress session-meter" role="progressbar" aria-label="Tiến độ phiên học" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPercent)}>
        <span style={{ '--v': progressPercent / 100 }} />
      </div>
      <main className="session-main" id="main">
        <div className="sheet flash">
          {currentItem ? <>
            <div className="form-head" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 0 }}>
              <div className="form-code"><span>Thẻ {doneCount + 1}</span><span>{englishFront ? 'Anh → Việt' : 'Việt → Anh'}</span></div>
            </div>
            <div className="face">
              <p className="face-label">{englishFront ? 'Mặt trước, nhớ lại nghĩa' : 'Mặt trước, nhớ lại từ tiếng Anh'}</p>
              <div className={englishFront ? 'flash-word' : 'flash-mean'} lang={englishFront ? 'en' : 'vi'}>{englishFront ? the.tu : the.nghiaVi}</div>
              {englishFront && the.phienAm && <p className="ipa">{the.phienAm}</p>}
              {the.tuLoai && <p className="pos">{the.tuLoai}</p>}
            </div>
            {flipped && <div className="face back" role="region" aria-label="Mặt sau" aria-live="polite">
              <p className="face-label">Mặt sau</p>
              <div className={englishFront ? 'flash-mean' : 'flash-word'} lang={englishFront ? 'vi' : 'en'}>{englishFront ? the.nghiaVi : the.tu}</div>
              {!englishFront && the.phienAm && <p className="ipa">{the.phienAm}</p>}
              {the.viDuEn && <p className="example en" lang="en">“{the.viDuEn}”</p>}
            </div>}
            <div className="row">{(englishFront || flipped) && <SpeakButton text={the.tu} />}{flipped && the.viDuEn && <SpeakButton sentence text={the.viDuEn} />}</div>
            <div className="actions">
              {!flipped ? <Button ref={flipButton} variant="primary" className="flip" onClick={handleFlip}>Lật thẻ <span className="kbd">Space</span></Button> :
                <div><p className="rate-caption">Lần ôn tiếp theo</p><div className="rates" role="group" aria-label="Bạn nhớ từ này thế nào?">
                  {ratings.map(([rate, label], index) => <button type="button" className="rate" key={rate} ref={element => { rateButtons.current[index] = element; }} onClick={() => handleRate(rate)} disabled={reviewMutation.isPending}>
                    <span className="rate-top"><span className="kbd">{index + 1}</span>{label}</span>
                    {currentItem.duKien?.[rate] && <span className="rate-when">{currentItem.duKien[rate]}</span>}
                  </button>)}
                </div></div>}
            </div>
          </> : <div className="wait" role="status">Không còn thẻ cần ôn ngay. Vui lòng chờ hoặc kết thúc phiên.</div>}
        </div>
      </main>
    </div>
  );
}

export default function FlashcardSessionPage() {
  return <Suspense fallback={<div className="flash-note" role="status">Đang tải phiên học…</div>}><FlashcardSessionContent /></Suspense>;
}
