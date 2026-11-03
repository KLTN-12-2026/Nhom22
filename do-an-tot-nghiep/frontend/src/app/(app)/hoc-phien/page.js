'use client';
import { SpeakButton } from '@/components/content/SpeakButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

const QUEUED = 'CHUA_TRA_LOI';
const ANSWERED = 'DA_TRA_LOI';

function FlashcardSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const flipButton = useRef(null);
  const rateButtons = useRef([]);

  const [flipped, setFlipped] = useState(false);
  const [queueDraft, setQueue] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [waitSeconds, setWaitSeconds] = useState(0);


  const { data, isLoading, error } = useQuery({
    queryKey: ['session', id],
    queryFn: () => apiFetch(`/api/v1/learning/sessions/${id}`),
    enabled: !!id
  });

  const session = data;
  const queue = queueDraft ?? data?.hangDoi ?? [];

  useEffect(() => {
    if (!session?.hetGioAt) return undefined;
    const update = () => setSecondsLeft(Math.max(0, Math.ceil((Date.parse(session.hetGioAt) - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [session?.hetGioAt]);


  const reviewMutation = useMutation({
    mutationFn: (body) => apiFetch(`/api/v1/learning/sessions/${id}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
  });

  const finishMutation = useMutation({
    mutationFn: () => apiFetch(`/api/v1/learning/sessions/${id}/finish`, { method: 'POST' }),
    onSuccess: (summary) => {
      sessionStorage.setItem(`learning-summary:${id}`, JSON.stringify(summary));
      router.push(`/hoc-tong-ket?id=${id}`);
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

  const currentItem = queue.find(q => q.trangThai === QUEUED && (!q.tienDo?.hanOnAt || new Date(q.tienDo.hanOnAt) <= new Date()));
  const realItems = queue.filter(q => q.the);
  const doneCount = realItems.filter(q => q.trangThai === ANSWERED).length;
  const progressPercent = realItems.length ? (doneCount / realItems.length) * 100 : 0;
  const nextDueAt = queue
    .filter(q => q.trangThai === QUEUED && q.the && q.tienDo?.hanOnAt && Date.parse(q.tienDo.hanOnAt) > Date.now())
    .map(q => Date.parse(q.tienDo.hanOnAt))
    .sort((a, b) => a - b)[0];
  const timerText = secondsLeft == null
    ? '--:--'
    : `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  useEffect(() => {
    if (!nextDueAt) {
      setWaitSeconds(0);
      return undefined;
    }
    const update = () => setWaitSeconds(Math.max(0, Math.ceil((nextDueAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [nextDueAt]);

  if (!id) return <main className="session-main"><div className="sheet error-state"><h3>Không tìm thấy phiên học</h3><Button variant="secondary" onClick={() => router.push('/hom-nay')}>Về Hôm nay</Button></div></main>;
  if (isLoading) return <main className="session-main"><div className="sheet"><div className="skeleton"><div className="sk sk-title"></div><div className="sk" style={{ height: 220 }}></div><div className="sk sk-row"></div></div></div></main>;
  if (error || !session) return <main className="session-main"><div className="sheet error-state"><h3>Chưa tải được phiên học</h3><p>{error?.message || 'Vui lòng thử lại.'}</p><Button variant="secondary" onClick={() => router.refresh()}>Thử lại</Button></div></main>;

  const handleFlip = () => {
    setFlipped(true);
  };

  const handleFinish = () => {
    if (!finishMutation.isPending) finishMutation.mutate();
  };

  const handleRate = async (rate) => {
    if (!currentItem || !flipped || reviewMutation.isPending) return;
    try {
      const res = await reviewMutation.mutateAsync({
        clientEventId: `${id}:${currentItem.theId}:${Date.now()}:${crypto.randomUUID()}`,
        theId: currentItem.theId,
        chieuHoc: session.chieuHoc,
        danhGia: rate,
        expectedVersion: currentItem.tienDo.version,
        thoiGianTraLoiMs: 1500
      });

      const newQueue = [...queue];
      const index = newQueue.findIndex(q => q.theId === currentItem.theId && q.trangThai === QUEUED);
      if (index !== -1) {
        newQueue[index].trangThai = ANSWERED;
        newQueue[index].tienDo = res.tienDo;
      }

      if (res.laiTrongPhien) {
        newQueue.push({
          theId: currentItem.theId,
          thuTu: newQueue.length + 1,
          trangThai: QUEUED,
          tienDo: res.tienDo,
          duKien: res.duKien,
          the: currentItem.the
        });
      }

      setQueue(newQueue);
      setFlipped(false);

      const remaining = newQueue.filter(q => q.trangThai === QUEUED);
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
        <Button variant="ghost" className="btn-icon" aria-label="Kết thúc phiên" title="Kết thúc phiên" onClick={handleFinish}><Icon name="x" /></Button>
        <div className="grow">
          <p className="bar-title">{session.boTheTen}</p>
          <p className="bar-sub"><span>{englishFront ? 'Anh → Việt' : 'Việt → Anh'}</span><span>Đã chấm {doneCount}/{realItems.length}</span></p>
        </div>
        <div className="bar-stamps">
          <span className="stamp" role="timer" aria-live="off"><Icon name="clock" />{timerText}</span>
          <span className={`stamp ${reviewMutation.isPending ? '' : 'stamp-success'}`} role="status"><Icon name={reviewMutation.isPending ? 'clock' : 'check'} /><span className="lbl">{reviewMutation.isPending ? 'Đang lưu' : 'Đã lưu'}</span></span>
        </div>
      <ThemeToggle className="theme-session" /></header>
      <div className="meter is-progress session-meter" role="progressbar" aria-label="Tiến độ phiên học" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPercent)}>
        <span style={{ '--v': progressPercent / 100 }} />
      </div>
      <main className="session-main" id="main">
        {secondsLeft === 0 && currentItem && <p className="notice notice-warning" role="status"><Icon name="info" /><span>Đã hết {session.quyThoiGian} phút. Chấm nốt thẻ này rồi phiên sẽ kết thúc.</span></p>}
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
              {the.viDuEn && (
                <div className="example">
                  <p className="en" lang="en">“{the.viDuEn}”</p>
                  {the.dichVi && <p className="vi" lang="vi">{the.dichVi}</p>}
                  <SpeakButton sentence text={the.viDuEn} />
                </div>
              )}
            </div>}
            <div className="face-tools">{(englishFront || flipped) && <SpeakButton text={the.tu} />}</div>
            <div className="actions">
              {!flipped ? <Button ref={flipButton} variant="primary" className="flip" onClick={handleFlip}>Lật thẻ <span className="kbd">Space</span></Button> :
                <div>
                  <p className="rate-caption">Lần ôn tiếp theo</p>
                  <div className="rates" role="group" aria-label="Bạn nhớ từ này thế nào?">
                    {ratings.map(([rate, label], index) => <button type="button" className="rate" key={rate} ref={element => { rateButtons.current[index] = element; }} onClick={() => handleRate(rate)} disabled={reviewMutation.isPending}>
                      <span className="rate-top"><span className="kbd">{index + 1}</span>{label}</span>
                      {currentItem.duKien?.[rate] && <span className="rate-when">{currentItem.duKien[rate]}</span>}
                    </button>)}
                  </div>
                  <details className="rate-help">
                    <summary>Khi nào chọn mức nào?</summary>
                    <ul>
                      <li><strong>Quên</strong>: không nhớ ra, hoặc nhớ sai.</li>
                      <li><strong>Khó</strong>: nhớ ra nhưng phải nghĩ lâu.</li>
                      <li><strong>Nhớ</strong>: nhớ đúng trong vài giây.</li>
                      <li><strong>Dễ</strong>: biết ngay, không cần nghĩ.</li>
                      <li>Thời gian dưới mỗi nút là lần ôn tiếp theo do máy chủ tính.</li>
                    </ul>
                  </details>
                </div>}
            </div>
          </> : <div className="wait" role="status">
            <h2>Thẻ tiếp theo chưa đến giờ ôn</h2>
            <p><span className="tally-n">{waitSeconds >= 60 ? Math.ceil(waitSeconds / 60) : waitSeconds}</span><span>{waitSeconds >= 60 ? ' phút nữa' : ' giây nữa'}</span></p>
            <p className="muted">Các thẻ vừa học lại cần nghỉ ngắn trước khi gặp lại. Bạn có thể đợi hoặc kết thúc phiên ngay.</p>
            <Button variant="primary" onClick={handleFinish} disabled={finishMutation.isPending}>{finishMutation.isPending ? 'Đang kết thúc...' : 'Kết thúc phiên'}</Button>
          </div>}
        </div>
        <details className="key-help">
          <summary><Icon name="keyboard" />Phím tắt</summary>
          <ul>
            <li><span className="kbd">Space</span> Lật thẻ</li>
            <li><span className="kbd">1</span> <span className="kbd">2</span> <span className="kbd">3</span> <span className="kbd">4</span> Quên, Khó, Nhớ, Dễ sau khi lật</li>
            <li>Phím tắt không hoạt động khi con trỏ đang ở ô nhập.</li>
          </ul>
        </details>
      </main>
    </div>
  );
}

export default function FlashcardSessionPage() {
  return <Suspense fallback={<div className="flash-note" role="status">Đang tải phiên học…</div>}><FlashcardSessionContent /></Suspense>;
}
