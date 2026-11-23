'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import { PracticeHowTo, PracticeSample } from '@/components/practice/PracticeGuide';
import { Icon } from '@/components/ui';
import { useMucTip } from '@/components/mascot/useMucTip';
import { SKILL, SKILL_PRACTICE } from '@/lib/practice-labels.mjs';
import {
  DEFAULT_RATINGS, RATINGS, RECENT_DAYS, RECENT_SOURCE, initialSource, matchedCount, practiceBody, recentPath, recentTotal, resolveSource, toggleRating
} from '@/lib/practice-recent.mjs';
import styles from './page.module.css';

const TYPES = [
  { id: 'CHON_NGHIA', name: 'Chọn nghĩa', desc: 'Thấy từ tiếng Anh, chọn nghĩa đúng trong 4 phương án', skill: 'Nhận nghĩa' },
  { id: 'CHON_TU', name: 'Chọn từ', desc: 'Thấy nghĩa tiếng Việt, chọn từ đúng', skill: 'Nhận nghĩa' },
  { id: 'GHEP_TU', name: 'Ghép từ', desc: 'Nối từ với nghĩa, chấm từng cặp', skill: 'Nhận nghĩa' },
  { id: 'DIEN_CHO_TRONG', name: 'Điền chỗ trống', desc: 'Điền từ còn thiếu vào câu ví dụ', skill: 'Dùng từ trong câu' },
  { id: 'NHAP_TU_THEO_NGHIA', name: 'Nhập từ theo nghĩa', desc: 'Gõ từ tiếng Anh theo nghĩa cho sẵn', skill: 'Viết đúng chính tả' },
  { id: 'NGHE_VIET', name: 'Nghe viết', desc: 'Nghe phát âm rồi gõ lại từ', skill: 'Nghe và viết' },
  { id: 'PHAN_BIET_CAP', name: 'Phân biệt cặp dễ nhầm', desc: 'Chọn đúng từ giữa hai từ bạn hay nhầm', skill: 'Phân biệt cặp dễ nhầm' },
  { id: 'TONG_HOP', name: 'Tổng hợp', desc: 'Trộn nhiều dạng, báo kết quả theo từng kỹ năng', skill: 'Nhiều kỹ năng' }
];

function PracticeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get('loaiBai') || 'CHON_NGHIA';
  const defaultDeckId = searchParams.get('boTheId');
  const defaultSource = searchParams.get('nguon');

  const [loaiBai, setLoaiBai] = useState(TYPES.find(t => t.id === defaultType) ? defaultType : 'CHON_NGHIA');
  const current = TYPES.find(t => t.id === loaiBai) || TYPES[0];
  const [soCau, setSoCau] = useState(10);
  const [picked, setPicked] = useState(initialSource({ nguon: defaultSource, boTheId: defaultDeckId }));
  const [touched, setTouched] = useState(false);
  const [ratings, setRatings] = useState(DEFAULT_RATINGS);
  const [errorMsg, setErrorMsg] = useState('');
  const [focusFull, setFocusFull] = useState(true);

  const { data: myDecks = [] } = useQuery({
    queryKey: ['my-decks', 'all'],
    queryFn: () => fetchAllPages('/api/v1/decks')
  });

  const { data: recent, isLoading: isRecentLoading, isError: isRecentError, refetch: refetchRecent } = useQuery({
    queryKey: ['practice-recent', ratings],
    queryFn: () => apiFetch(recentPath(ratings)),
    placeholderData: previous => previous
  });
  const source = isRecentError && !touched && picked === RECENT_SOURCE
    ? ''
    : resolveSource(picked, recent, { explicit: touched || defaultSource === RECENT_SOURCE });
  const recentAll = recentTotal(recent);
  const recentMatched = matchedCount(recent, ratings);
  const recentReady = !isRecentLoading && !isRecentError;
  const recentBlocked = source === RECENT_SOURCE && (isRecentLoading || recentMatched === 0);
  const deckSource = source !== RECENT_SOURCE && source !== 'SO_TAY';
  const pickSource = (value) => {
    setPicked(value);
    setTouched(true);
    setErrorMsg('');
  };

  const { data: history, isLoading: isHistoryLoading, isError: isHistoryError, refetch: refetchHistory } = useQuery({
    queryKey: ['practice-history'],
    queryFn: () => apiFetch('/api/v1/practice/history?size=3')
  });

  const { data: skills } = useQuery({
    queryKey: ['skills', null],
    queryFn: () => apiFetch('/api/v1/statistics/skills'),
    staleTime: 300000
  });
  const weakest = (skills || []).filter(item => item.duDuLieu && item.mucLamChu != null).sort((a, b) => a.mucLamChu - b.mucLamChu)[0];
  const weakType = weakest && TYPES.find(t => t.id === SKILL_PRACTICE[weakest.kyNang]);
  useMucTip(weakest && weakType && weakest.mucLamChu < 80 ? `Kỹ năng “${SKILL[weakest.kyNang]}” đang yếu nhất (${weakest.mucLamChu}%). Thử dạng “${weakType.name}” nhé.` : null);

  const sessionMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/practice/sessions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (res) => {
      router.push(`/luyen-tap-lam-bai?id=${res.id}`);
    },
    onError: (err) => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      setErrorMsg(err.message || 'Lỗi khi tạo phiên luyện tập');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (recentBlocked) {
      setErrorMsg('Chưa có từ nào khớp mức chấm đã chọn. Chọn thêm mức hoặc đổi nguồn.');
      return;
    }
    if (focusFull && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    sessionMutation.mutate(practiceBody({ loaiBai, soCau, source, ratings }));
  };

  return (
    <div className="page page-grid with-side">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code">
            <span>Luyện tập</span>
            <span>Bài cố định, chấm tại máy chủ</span>
          </div>
          <h1 id="page-title">Chọn dạng bài</h1>
          <p>Đề không kèm đáp án. Bạn nộp một lần, máy chủ chấm và giải thích từng câu. Câu sai được ghi vào sổ tay.</p>
        </div>

        <form id="form" className="stack-lg" noValidate onSubmit={handleSubmit}>
          <fieldset className="fieldset field" data-field="loaiBai">
            <legend>Dạng bài</legend>
            <div className={styles.typeGrid} id="types">
              {TYPES.map(t => (
                <label key={t.id} className={`choice choice-card ${styles.typeCard}`}>
                  <input type="radio" name="loaiBai" value={t.id} checked={loaiBai === t.id} onChange={() => setLoaiBai(t.id)} />
                  <span className="bubble" aria-hidden="true"></span>
                  <span className="choice-body">
                    <span className="choice-title">{t.name}</span>
                    <span className="choice-desc">{t.desc}</span>
                    <span className={styles.typeSkill}>{t.skill}</span>
                    <PracticeSample type={t.id} mini />
                  </span>
                </label>
              ))}
            </div>
            <PracticeHowTo type={loaiBai} name={current.name} skill={current.skill} />
            <p className="field-error"></p>
          </fieldset>

          <fieldset className="fieldset field" data-field="nguon">
            <legend>Lấy từ</legend>
            <div className="choice-grid cols-3">
              <label className="choice choice-card">
                <input type="radio" name="nguon" value={RECENT_SOURCE} checked={source === RECENT_SOURCE} disabled={recentReady && recentAll === 0} onChange={() => pickSource(RECENT_SOURCE)} />
                <span className="bubble" aria-hidden="true"></span>
                <span className="choice-body">
                  <span className={styles.sourceTitle}>
                    <span className="choice-title">Từ vừa học cần ôn</span>
                    <span className="stamp stamp-solid">Mặc định</span>
                  </span>
                  <span className="choice-desc">
                    {isRecentLoading
                      ? 'Đang đếm lượt chấm gần đây…'
                      : recentAll > 0
                        ? `${recentAll} từ bạn đã chấm trong ${RECENT_DAYS} ngày qua`
                        : `Chưa có lượt chấm nào trong ${RECENT_DAYS} ngày qua`}
                  </span>
                </span>
              </label>
              <label className="choice choice-card">
                <input type="radio" name="nguon" value="SO_TAY" checked={source === 'SO_TAY'} onChange={() => pickSource('SO_TAY')} />
                <span className="bubble" aria-hidden="true"></span>
                <span className="choice-body">
                  <span className="choice-title">Sổ tay từ khó</span>
                  <span className="choice-desc">Từ bạn hay sai hoặc tự đánh dấu</span>
                </span>
              </label>
              <label className="choice choice-card">
                <input type="radio" name="nguon" value="BO_THE" checked={deckSource} onChange={() => pickSource('')} />
                <span className="bubble" aria-hidden="true"></span>
                <span className="choice-body">
                  <span className="choice-title">Bộ thẻ của tôi</span>
                  <span className="choice-desc">Tất cả bộ hoặc một bộ cụ thể</span>
                </span>
              </label>
            </div>

            {source === RECENT_SOURCE && (
              <div className={styles.sourceDetail}>
                <fieldset className="fieldset" data-field="danhGia">
                  <legend className="field-label">Mức đã chấm</legend>
                  <div className={styles.ratingGrid}>
                    {RATINGS.map(r => (
                      <label key={r.id} className="choice choice-card">
                        <input type="checkbox" checked={ratings.includes(r.id)} onChange={() => setRatings(list => toggleRating(list, r.id))} />
                        <span className="bubble box" aria-hidden="true"><Icon name="check" className="box-check" /></span>
                        <span className="choice-body">
                          <span className="choice-title">{r.label}</span>
                          <span className="choice-desc">{recent?.theoDanhGia?.[r.id] ?? 0} từ</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="field-hint">Mặc định gồm Quên, Khó và Dễ. Mỗi từ tính theo lượt chấm mới nhất.</p>
                </fieldset>
                <div data-view={isRecentLoading ? 'loading' : isRecentError ? 'error' : recentMatched > 0 ? 'ready' : 'empty'}>
                  <div data-when="loading">
                    <div className="skeleton"><div className="sk sk-line"></div><div className="sk sk-line"></div></div>
                  </div>
                  <div data-when="error">
                    <p className="notice notice-danger" role="alert">Chưa tải được từ vừa học. <button type="button" className="link-btn" onClick={() => refetchRecent()}>Thử lại</button></p>
                  </div>
                  <div data-when="ready">
                    <ol className={styles.recentWords} role="list" aria-label="Từ sẽ được luyện">
                      {recent?.the?.slice(0, 8).map(item => (
                        <li key={item.theId}>
                          <span className={styles.word}>{item.tu}</span>
                          <span className={styles.meaning}>{item.nghiaVi}</span>
                          <span className="stamp stamp-quiet">{RATINGS.find(r => r.id === item.danhGia)?.label}</span>
                        </li>
                      ))}
                    </ol>
                    {recentMatched > 8 && <p className="field-hint">Và {recentMatched - 8} từ khác.</p>}
                  </div>
                  <div data-when="empty">
                    <p className="notice">Không có từ nào khớp mức đã chọn. Chọn thêm mức chấm hoặc đổi nguồn.</p>
                  </div>
                </div>
              </div>
            )}

            {recentReady && recentAll === 0 && (
              <p className={`notice ${styles.sourceEmpty}`}>
                Bạn chưa chấm thẻ nào trong {RECENT_DAYS} ngày qua nên chưa có từ vừa học. Đã chọn bộ thẻ của bạn. <Link className="link-btn" href="/hom-nay">Học hôm nay</Link>
              </p>
            )}

            {deckSource && (
              <div className={`field ${styles.sourceDetail}`}>
                <label className="field-label" htmlFor="source">Bộ thẻ</label>
                <select className="select" id="source" name="source" value={source} onChange={(e) => pickSource(e.target.value)}>
                  <option value="">Tất cả bộ của tôi</option>
                  {myDecks.map(deck => (
                    <option key={deck.id} value={`deck:${deck.id}`}>
                      {deck.ten.length > 80 ? deck.ten.slice(0, 80) + '…' : deck.ten}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <p className="field-hint">Phân biệt cặp dễ nhầm chỉ dùng các cặp bạn từng chọn nhầm.</p>
          </fieldset>

          <fieldset className="fieldset field" data-field="soCau">
            <legend>Số câu</legend>
            <div className="choice-grid cols-3">
              {[5, 10, 20].map(m => (
                <label key={m} className="choice choice-card">
                  <input type="radio" name="soCau" value={m} checked={soCau === m} onChange={() => setSoCau(m)} />
                  <span className="bubble" aria-hidden="true"></span>
                  <span className="choice-body">
                    <span className="choice-title">{m} câu</span>
                    <span className="choice-desc">khoảng {m === 5 ? 3 : m === 10 ? 6 : 12} phút</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="field-hint">Nếu nguồn có ít thẻ hơn, đề sẽ ngắn hơn. Với ghép từ, mỗi câu gồm tối đa 5 cặp.</p>
            <p className="field-error"></p>
          </fieldset>

          <label className="choice choice-card">
            <input type="checkbox" checked={focusFull} onChange={e => setFocusFull(e.target.checked)} />
            <span className="bubble box" aria-hidden="true"><Icon name="check" className="box-check" /></span>
            <span className="choice-body">
              <span className="choice-title">Làm bài toàn màn hình</span>
              <span className="choice-desc">Ẩn mọi thứ khác để tập trung. Nhấn Esc hoặc nút trên thanh làm bài để thoát.</span>
            </span>
          </label>

          <div data-form-error hidden={!errorMsg}>{errorMsg}</div>

          <div className={styles.formFoot}>
            <button type="submit" className="btn btn-accent btn-lg" id="submit" disabled={sessionMutation.isPending || recentBlocked}>
              {sessionMutation.isPending ? 'Đang tạo...' : 'Làm bài'}
            </button>
            <Link className="btn btn-quiet" href="/luyen-tap-lich-su">Xem lịch sử bài làm</Link>
          </div>
        </form>
      </section>

      <aside className="side-col">
        <section className="panel" aria-labelledby="recent-title">
          <h2 className="panel-title" id="recent-title">Bài gần đây</h2>
          <div data-view={isHistoryLoading ? "loading" : isHistoryError ? "error" : (history?.items?.length > 0 ? "ready" : "empty")} id="recent-region">
            <div data-when="loading">
              <div className="skeleton"><div className="sk sk-line"></div><div className="sk sk-line"></div></div>
            </div>
            <div data-when="error">
              <p className="notice notice-danger" role="alert">Chưa tải được bài gần đây. <button type="button" className="link-btn" onClick={() => refetchHistory()}>Thử lại</button></p>
            </div>
            <div data-when="ready">
              <ul className={styles.recent} id="recent" role="list">
                {history?.items?.map(a => (
                  <li key={a.baiLuyenId}>
                    <Link href={`/luyen-tap-ket-qua?id=${a.baiLuyenId}`}>
                      {TYPES.find(t => t.id === a.loaiBai)?.name || a.loaiBai} {a.laLuyenLai && "(luyện lại)"}
                    </Link>
                    <span className={styles.meta}>
                      <span>Đúng {a.soCauDung}/{a.tongSoCau}</span>
                      <span>{new Date(a.nopAt).toLocaleDateString('vi-VN')}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div data-when="empty">
              <p className="small muted">Bạn chưa làm bài nào.</p>
            </div>
          </div>
          <Link className="btn btn-secondary btn-sm side-action" href="/luyen-tap-lich-su">
            Tất cả bài làm
          </Link>
        </section>

        <section className="panel" aria-labelledby="nb-title">
          <h2 className="panel-title" id="nb-title">Luyện từ hay sai</h2>
          <p className="small muted">Chọn nguồn <strong>Sổ tay từ khó</strong> để luyện các từ bạn sai nhiều hoặc tự đánh dấu.</p>
          <Link className="btn btn-secondary btn-sm side-action" href="/so-tay">
            Mở sổ tay
          </Link>
        </section>
      </aside>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div className="skeleton" style={{ padding: 'var(--sp-6)' }}><div className="sk sk-row"></div></div>}>
      <PracticeForm />
    </Suspense>
  );
}
