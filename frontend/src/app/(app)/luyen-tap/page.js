'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
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
  const [soCau, setSoCau] = useState(10);
  const [source, setSource] = useState(defaultSource === 'SO_TAY' ? 'SO_TAY' : (defaultDeckId ? `deck:${defaultDeckId}` : ''));
  const [errorMsg, setErrorMsg] = useState('');

  const { data: myDecks } = useQuery({
    queryKey: ['my-decks'],
    queryFn: () => apiFetch('/api/v1/decks?tab=mine').catch(() => ({ items: [] }))
  });

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['practice-history'],
    queryFn: () => apiFetch('/api/v1/practice/history?size=3').catch(() => ({ items: [] }))
  });

  const sessionMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/practice/sessions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (res) => {
      router.push(`/luyen-tap-lam-bai?id=${res.id}`);
    },
    onError: (err) => setErrorMsg(err.message || 'Lỗi khi tạo phiên luyện tập')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const boTheId = source.startsWith('deck:') ? source.slice(5) : null;
    const nguon = source === 'SO_TAY' ? 'SO_TAY' : 'BO_THE';
    sessionMutation.mutate({ loaiBai, soCau: Number(soCau), boTheId, nguon });
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
              {myDecks?.items?.map(deck => (
                <option key={deck.id} value={`deck:${deck.id}`}>
                  {deck.name.length > 80 ? deck.name.slice(0, 80) + '…' : deck.name} ({deck.cardCount} thẻ)
                </option>
              ))}
            </select>
            <p className="field-hint">Phân biệt cặp dễ nhầm chỉ dùng các cặp bạn từng chọn nhầm.</p>
          </div>

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

          <div data-form-error hidden={!errorMsg}>{errorMsg}</div>

          <div className={styles.formFoot}>
            <button type="submit" className="btn btn-accent btn-lg" id="submit" disabled={sessionMutation.isPending}>
              {sessionMutation.isPending ? 'Đang tạo...' : 'Làm bài'}
            </button>
            <Link className="btn btn-quiet" href="/luyen-tap-lich-su">Xem lịch sử bài làm</Link>
          </div>
        </form>
      </section>

      <aside className="side-col">
        <section className="panel" aria-labelledby="recent-title">
          <h2 className="panel-title" id="recent-title">Bài gần đây</h2>
          <div data-view={isHistoryLoading ? "loading" : (history?.items?.length > 0 ? "ready" : "empty")} id="recent-region">
            <div data-when="loading">
              <div className="skeleton"><div className="sk sk-line"></div><div className="sk sk-line"></div></div>
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
            <div data-when="error"></div>
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
