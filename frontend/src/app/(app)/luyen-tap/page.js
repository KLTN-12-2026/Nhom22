'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { fetchAllPages } from '@/lib/fetch-all-pages';
import styles from './page.module.css';

const TYPES = [
  { id: 'FLASHCARD', name: 'Flashcard', desc: 'Lật thẻ ghi nhớ, tự đánh giá theo phương pháp ngắt quãng (SRS)', skill: 'Ghi nhớ cốt lõi' },
  { id: 'CHON_TU', name: 'Chọn từ', desc: 'Thấy nghĩa tiếng Việt, chọn từ đúng', skill: 'Nhận nghĩa' },
  { id: 'GHEP_TU', name: 'Ghép từ', desc: 'Nối từ với nghĩa, chấm từng cặp', skill: 'Nhận nghĩa' },
  { id: 'DIEN_CHO_TRONG', name: 'Điền chỗ trống', desc: 'Game điền từ vào câu ngữ cảnh, 4 lựa chọn A/B/C/D (20s/câu)', skill: 'Ngữ cảnh câu' },
  { id: 'NHAP_TU_THEO_NGHIA', name: 'Nhập từ theo nghĩa', desc: 'Gõ từ tiếng Anh theo nghĩa cho sẵn', skill: 'Viết đúng chính tả' },
  { id: 'NGHE_VIET', name: 'Nghe viết', desc: 'Nghe phát âm rồi gõ lại từ', skill: 'Nghe và viết' },
  { id: 'PHAN_BIET_CAP', name: 'Phân biệt cặp dễ nhầm', desc: 'Chọn đúng từ giữa hai từ bạn hay nhầm', skill: 'Phân biệt cặp dễ nhầm' },
  { id: 'TONG_HOP', name: 'Tổng hợp', desc: 'Trộn nhiều dạng, báo kết quả theo từng kỹ năng', skill: 'Nhiều kỹ năng' }
];

function PracticeForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultType = searchParams.get('loaiBai') || 'FLASHCARD';
  const defaultDeckId = searchParams.get('boTheId');
  const defaultSource = searchParams.get('nguon');

  const [loaiBai, setLoaiBai] = useState(TYPES.find(t => t.id === defaultType) ? defaultType : 'FLASHCARD');
  const [soCau, setSoCau] = useState(10);
  const [source, setSource] = useState(defaultSource === 'SO_TAY' ? 'SO_TAY' : (defaultDeckId ? `deck:${defaultDeckId}` : ''));
  const [errorMsg, setErrorMsg] = useState('');

  const { data: myDecks = [] } = useQuery({
    queryKey: ['my-decks', 'all'],
    queryFn: () => fetchAllPages('/api/v1/decks')
  });

  const { data: history, isLoading: isHistoryLoading, isError: isHistoryError, refetch: refetchHistory } = useQuery({
    queryKey: ['practice-history'],
    queryFn: () => apiFetch('/api/v1/practice/history?size=3')
  });

  const practiceMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/practice/sessions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (res) => {
      router.push(`/luyen-tap-lam-bai?id=${res.id}`);
    },
    onError: (err) => setErrorMsg(err.message || 'Lỗi khi tạo phiên luyện tập')
  });

  const flashcardMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/learning/sessions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (res) => {
      router.push(`/hoc-phien?id=${res.id}`);
    },
    onError: (err) => setErrorMsg(err.message || 'Lỗi khi bắt đầu phiên học Flashcard')
  });

  const isSubmitting = practiceMutation.isPending || flashcardMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const boTheId = source.startsWith('deck:') ? source.slice(5) : null;
    const nguon = source === 'SO_TAY' ? 'SO_TAY' : 'BO_THE';

    if (loaiBai === 'FLASHCARD') {
      if (source === 'SO_TAY') {
        setErrorMsg('Học Flashcard SRS áp dụng cho Tất cả bộ của tôi hoặc từng Bộ thẻ cụ thể. Để luyện từ trong Sổ tay, vui lòng chọn các dạng bài khác.');
        return;
      }
      flashcardMutation.mutate({
        boTheId: boTheId ? String(boTheId) : null,
        chieuHoc: 'EN_VI',
        quyThoiGian: Number(soCau),
        hocTuDo: true
      });
    } else {
      practiceMutation.mutate({ loaiBai, soCau: Number(soCau), boTheId, nguon });
    }
  };

  return (
    <div className="page page-grid with-side">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code">
            <span>Học & Luyện tập</span>
            <span>Flashcard SRS và các dạng bài tập</span>
          </div>
          <h1 id="page-title">Chọn hình thức học & luyện tập</h1>
          <p>Ôn tập ghi nhớ qua Flashcard hoặc làm các bài luyện tập chấm điểm theo kỹ năng.</p>
        </div>

        <form id="form" className="stack-lg" noValidate onSubmit={handleSubmit}>
          <fieldset className="fieldset field" data-field="loaiBai">
            <legend>Dạng bài</legend>
            <div className={styles.typeGrid} id="types">
              {TYPES.map(t => (
                <label key={t.id} className="choice choice-card">
                  <input type="radio" name="loaiBai" value={t.id} checked={loaiBai === t.id} onChange={() => setLoaiBai(t.id)} />
                  <span className="bubble" aria-hidden="true"></span>
                  <span className="choice-body">
                    <span className="choice-title">{t.name}</span>
                    <span className="choice-desc">{t.desc}</span>
                    <span className={styles.typeSkill}>{t.skill}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="field-error"></p>
          </fieldset>

          <div className="field">
            <label className="field-label" htmlFor="source">Lấy từ</label>
            <select className="select" id="source" name="source" value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">Tất cả bộ của tôi</option>
              <option value="SO_TAY">Sổ tay từ khó</option>
              {myDecks.map(deck => (
                <option key={deck.id} value={`deck:${deck.id}`}>
                  {deck.ten.length > 80 ? deck.ten.slice(0, 80) + '…' : deck.ten}
                </option>
              ))}
            </select>
            <p className="field-hint">Phân biệt cặp dễ nhầm chỉ dùng các cặp bạn từng chọn nhầm.</p>
          </div>

          <fieldset className="fieldset field" data-field="soCau">
            <legend>{loaiBai === 'FLASHCARD' ? 'Thời gian học' : 'Số câu'}</legend>
            <div className="choice-grid cols-3">
              {[5, 10, 20].map(m => (
                <label key={m} className="choice choice-card">
                  <input type="radio" name="soCau" value={m} checked={soCau === m} onChange={() => setSoCau(m)} />
                  <span className="bubble" aria-hidden="true"></span>
                  <span className="choice-body">
                    <span className="choice-title">{loaiBai === 'FLASHCARD' ? `${m} phút` : `${m} câu`}</span>
                    <span className="choice-desc">{loaiBai === 'FLASHCARD' ? `Khoảng ${m * 3} thẻ` : `khoảng ${m === 5 ? 3 : m === 10 ? 6 : 12} phút`}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="field-hint">
              {loaiBai === 'FLASHCARD'
                ? 'Hệ thống tự động xếp thẻ theo thuật toán ngắt quãng SRS (thẻ quá hạn, đến hạn và từ mới).'
                : 'Nếu nguồn có ít thẻ hơn, đề sẽ ngắn hơn. Với ghép từ, mỗi câu gồm tối đa 5 cặp.'}
            </p>
            <p className="field-error"></p>
          </fieldset>

          <div data-form-error hidden={!errorMsg}>{errorMsg}</div>

          <div className={styles.formFoot}>
            <button type="submit" className="btn btn-accent btn-lg" id="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang khởi tạo...' : (loaiBai === 'FLASHCARD' ? 'Bắt đầu học Flashcard' : 'Làm bài')}
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
          <Link className="btn btn-quiet" href="/luyen-tap-lich-su" style={{ margin: 'var(--sp-2) 0 0 -12px' }}>
            Tất cả bài làm
          </Link>
        </section>

        <section className="panel" aria-labelledby="nb-title">
          <h2 className="panel-title" id="nb-title">Luyện từ hay sai</h2>
          <p className="small muted">Chọn nguồn <strong>Sổ tay từ khó</strong> để luyện các từ bạn sai nhiều hoặc tự đánh dấu.</p>
          <Link className="btn btn-quiet" href="/so-tay" style={{ margin: 'var(--sp-2) 0 0 -12px' }}>
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
