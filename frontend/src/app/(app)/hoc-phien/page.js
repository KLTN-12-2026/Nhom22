'use client';
import { SpeakButton } from '@/components/content/SpeakButton';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

const ALWAYS_DUE = ['MOI', 'ON_TAP'];
const currentTime = () => Date.now();

function generateClientEventId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'ev_' + currentTime() + '_' + Math.random().toString(36).substring(2, 9);
}

function isDue(item, now) {
  const hanOnAt = item.tienDo?.hanOnAt;
  return !hanOnAt || ALWAYS_DUE.includes(item.tienDo?.trangThai) || Date.parse(hanOnAt) <= now;
}

function FlashcardSessionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const flipButton = useRef(null);
  const rateButtons = useRef([]);
  const cardStartTimeRef = useRef(0);
  const finishStarted = useRef(false);

  const [flippedKey, setFlippedKey] = useState(null);
  const [queueDraft, setQueue] = useState(null);
  const [notice, setNotice] = useState('');
  const [now, setNow] = useState(currentTime);

  const { data, isLoading, error, refetch } = useQuery({
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
    onSuccess: () => router.replace(`/hoc-tong-ket?id=${id}`),
    onError: () => { finishStarted.current = false; }
  });

  const startFinish = () => {
    if (finishStarted.current) return;
    finishStarted.current = true;
    finishMutation.mutate();
  };

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

  const active = session?.trangThai === 'DANG_HOC';
  const pending = queue.filter(q => q.trangThai === 'CHUA_TRA_LOI' && q.the);
  const currentItem = pending.find(q => isDue(q, now));
  const realItems = queue.filter(q => q.the);
  const doneCount = realItems.filter(q => q.trangThai !== 'CHUA_TRA_LOI').length;
  const progressPercent = realItems.length ? (doneCount / realItems.length) * 100 : 0;
  const timeUp = !!session?.hetGioAt && Date.parse(session.hetGioAt) <= now;
  const nextDueAt = !currentItem && pending.length ? Math.min(...pending.map(q => Date.parse(q.tienDo.hanOnAt))) : null;
  const shouldFinish = active && !currentItem && (pending.length === 0 || timeUp);
  const currentKey = currentItem ? `${currentItem.theId}:${currentItem.thuTu}` : null;
  const flipped = flippedKey !== null && flippedKey === currentKey;

  useEffect(() => {
    cardStartTimeRef.current = currentTime();
  }, [currentKey]);

  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(() => setNow(currentTime()), 1000);
    return () => clearInterval(timer);
  }, [active]);

  useEffect(() => {
    if (session?.trangThai === 'KET_THUC') router.replace(`/hoc-tong-ket?id=${id}`);
  }, [session?.trangThai, router, id]);

  useEffect(() => {
    if (shouldFinish && finishMutation.isIdle) startFinish();
  });

  if (!id) return <div className="flash-note" role="alert">Thiếu mã phiên học. <Link href="/hoc">Chọn phiên học</Link></div>;
  if (isLoading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải phiên học...</div>;
  if (error || !session) {
    return (
      <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-danger)' }} role="alert">
        {error?.status === 404 ? 'Không tìm thấy phiên học.' : 'Lỗi tải phiên học.'} <Link href="/hoc">Chọn phiên học khác</Link>
      </div>
    );
  }

  const handleFlip = () => {
    setFlippedKey(currentKey);
  };

  const handleRate = async (rate) => {
    if (!currentItem || !flipped || reviewMutation.isPending) return;
    const item = currentItem;
    setNotice('');
    try {
      const thoiGianTraLoiMs = Math.min(120000, Math.max(100, currentTime() - cardStartTimeRef.current));
      const res = await reviewMutation.mutateAsync({
        clientEventId: generateClientEventId(),
        theId: item.theId,
        chieuHoc: session.chieuHoc,
        danhGia: rate,
        expectedVersion: item.tienDo?.version ?? 0,
        thoiGianTraLoiMs
      });
      const next = queue.map(q => (q === item ? { ...q, trangThai: 'DA_TRA_LOI', tienDo: res.tienDo ?? q.tienDo } : q));
      if (res.laiTrongPhien) {
        next.push({
          theId: item.theId,
          thuTu: Math.max(0, ...queue.map(q => q.thuTu || 0)) + 1,
          trangThai: 'CHUA_TRA_LOI',
          tienDo: res.tienDo ?? item.tienDo,
          the: item.the
        });
      }
      setQueue(next);
      setFlippedKey(null);
      setNow(currentTime());
      if (session.hetGioAt && Date.parse(session.hetGioAt) <= currentTime()) startFinish();
    } catch (err) {
      if (err.code === 'VERSION_CONFLICT') {
        setQueue(null);
        await refetch();
        setNotice('Thẻ này vừa được chấm ở nơi khác nên trạng thái đã đổi. Đã tải lại, bạn chấm lại theo trí nhớ của mình.');
      } else if (err.code === 'CONFLICT') {
        router.replace(`/hoc-tong-ket?id=${id}`);
      } else if (err.status === 404) {
        router.replace('/hoc');
      } else if (err.status === 422) {
        setQueue(queue.map(q => (q === item ? { ...q, trangThai: 'BO_QUA' } : q)));
        setNotice(err.message || 'Thẻ này không còn trong phiên, chuyển sang thẻ tiếp theo.');
      } else {
        setNotice(err.message || 'Lỗi khi lưu kết quả ôn');
      }
    }
  };

  const handleExit = () => {
    if (window.confirm('Kết thúc phiên học? Các thẻ đã chấm vẫn được lưu. Thẻ chưa chấm sẽ quay lại ở phiên sau.')) startFinish();
  };

  const the = currentItem?.the;
  const englishFront = session.chieuHoc === 'EN_VI';
  const ratings = [['QUEN', 'Quên'], ['KHO', 'Khó'], ['NHO', 'Nhớ'], ['DE', 'Dễ']];
  const waitSeconds = nextDueAt ? Math.max(0, Math.round((nextDueAt - now) / 1000)) : 0;
  const finishing = finishMutation.isPending || finishMutation.isSuccess || (shouldFinish && !finishMutation.isError);

  return (
    <div className="session">
      <header className="session-bar">
        <Button variant="ghost" className="btn-icon" aria-label="Kết thúc phiên học" onClick={handleExit} disabled={finishing}><Icon name="x" /></Button>
        <div className="grow">
          <p className="bar-title">{session.boTheTen || 'Tất cả bộ thẻ'}</p>
          <p className="bar-sub">{englishFront ? 'Anh → Việt' : 'Việt → Anh'}<span>{doneCount} / {realItems.length} thẻ</span></p>
        </div>
        <span className="stamp" role="status">{reviewMutation.isPending ? 'Đang lưu…' : finishing ? 'Đang kết thúc…' : 'Đã lưu'}</span>
        <ThemeToggle className="theme-session" />
      </header>
      <div className="meter is-progress session-meter" role="progressbar" aria-label="Tiến độ phiên học" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPercent)}>
        <span style={{ '--v': progressPercent / 100 }} />
      </div>
      <main className="session-main" id="main">
        <div className="sheet flash">
          {notice && <p className="notice notice-danger study-error" role="alert">{notice}</p>}
          {finishMutation.isError && (
            <p className="notice notice-danger study-error" role="alert">{finishMutation.error.message || 'Chưa kết thúc được phiên. Hãy thử lại.'}</p>
          )}
          {currentItem && the && !finishing ? (
            <>
              {timeUp && <p className="flash-note" role="status">Đã hết {session.quyThoiGian} phút. Chấm nốt thẻ này rồi phiên sẽ kết thúc.</p>}
              <div className="form-head" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: 0 }}>
                <div className="form-code"><span>Thẻ {doneCount + 1}</span><span>{englishFront ? 'Anh → Việt' : 'Việt → Anh'}</span></div>
              </div>
              <div className="face">
                <p className="face-label">{englishFront ? 'Mặt trước, nhớ lại nghĩa' : 'Mặt trước, nhớ lại từ tiếng Anh'}</p>
                <div className={englishFront ? 'flash-word' : 'flash-mean'} lang={englishFront ? 'en' : 'vi'}>{englishFront ? the.tu : the.nghiaVi}</div>
                {englishFront && the.phienAm && <p className="ipa">{the.phienAm}</p>}
                {the.tuLoai && <p className="pos">{the.tuLoai}</p>}
              </div>
              {flipped && (
                <div className="face back" role="region" aria-label="Mặt sau" aria-live="polite">
                  <p className="face-label">Mặt sau</p>
                  <div className={englishFront ? 'flash-mean' : 'flash-word'} lang={englishFront ? 'vi' : 'en'}>{englishFront ? the.nghiaVi : the.tu}</div>
                  {!englishFront && the.phienAm && <p className="ipa">{the.phienAm}</p>}
                  {the.viDuEn && <p className="example en" lang="en">“{the.viDuEn}”</p>}
                </div>
              )}
              <div className="row">
                {(englishFront || flipped) && <SpeakButton text={the.tu} />}
                {flipped && the.viDuEn && <SpeakButton sentence text={the.viDuEn} />}
              </div>
              <div className="actions">
                {!flipped ? (
                  <Button ref={flipButton} variant="primary" className="flip" onClick={handleFlip}>
                    Lật thẻ <span className="kbd">Space</span>
                  </Button>
                ) : (
                  <div>
                    <p className="rate-caption">Đánh giá khả năng nhớ</p>
                    <div className="rates" role="group" aria-label="Bạn nhớ từ này thế nào?">
                      {ratings.map(([rate, label], index) => (
                        <button
                          type="button"
                          className="rate"
                          key={rate}
                          ref={element => { rateButtons.current[index] = element; }}
                          onClick={() => handleRate(rate)}
                          disabled={reviewMutation.isPending}
                        >
                          <span className="rate-top"><span className="kbd">{index + 1}</span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : nextDueAt && !finishing ? (
            <div className="wait" role="status" style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>Thẻ tiếp theo chưa đến giờ ôn</h2>
              <p><span className="tally-n">{waitSeconds >= 60 ? Math.ceil(waitSeconds / 60) : waitSeconds}</span> {waitSeconds >= 60 ? 'phút nữa' : 'giây nữa'}</p>
              <p style={{ color: 'var(--color-ink-2)', marginBottom: 'var(--space-4)' }}>Các thẻ vừa học lại cần nghỉ ngắn trước khi gặp lại. Bạn có thể đợi hoặc kết thúc phiên ngay.</p>
              <Button variant="primary" onClick={startFinish}>Kết thúc phiên</Button>
            </div>
          ) : (
            <div className="wait" role="status" style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)' }}>
              <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-2)' }}>
                {finishMutation.isError ? 'Chưa kết thúc được phiên học' : 'Đang kết thúc phiên học…'}
              </h2>
              {finishMutation.isError && <Button variant="primary" onClick={startFinish}>Thử kết thúc lại</Button>}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function FlashcardSessionPage() {
  return (
    <Suspense fallback={<div className="flash-note" role="status">Đang tải phiên học…</div>}>
      <FlashcardSessionContent />
    </Suspense>
  );
}
