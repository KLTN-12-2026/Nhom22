'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button } from '@/components/ui';

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
  const [source, setSource] = useState(defaultSource === 'SO_TAY' ? 'SO_TAY' : (defaultDeckId ? \`deck:\${defaultDeckId}\` : ''));

  const { data: myDecks } = useQuery({
    queryKey: ['my-decks'],
    queryFn: () => apiFetch('/api/v1/decks/my-decks')
  });

  const { data: history } = useQuery({
    queryKey: ['practice-history'],
    queryFn: () => apiFetch('/api/v1/practice/history?size=3')
  });

  const sessionMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/practice/sessions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (res) => {
      router.push(\`/luyen-tap-lam-bai?id=\${res.id}\`);
    },
    onError: (err) => alert(err.message || 'Lỗi khi tạo phiên luyện tập')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const boTheId = source.startsWith('deck:') ? source.slice(5) : null;
    const nguon = source === 'SO_TAY' ? 'SO_TAY' : 'BO_THE';
    sessionMutation.mutate({ loaiBai, soCau, boTheId, nguon });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid with-side">
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
            <span>Luyện tập</span> <span>&bull;</span> <span>Bài cố định, chấm tại máy chủ</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>Chọn dạng bài</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>Đề không kèm đáp án. Bạn nộp một lần, máy chủ chấm và giải thích từng câu. Câu sai được ghi vào sổ tay.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 'var(--space-6)' }}>
          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>Dạng bài</legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-3)' }}>
              {TYPES.map(t => (
                <label key={t.id} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: loaiBai === t.id ? 'var(--color-primary-tint)' : 'transparent', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <input type="radio" name="loaiBai" value={t.id} checked={loaiBai === t.id} onChange={() => setLoaiBai(t.id)} style={{ marginTop: '4px' }} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{t.name}</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: '4px' }}>{t.desc}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-primary)' }}>{t.skill}</div>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>Lấy từ</legend>
            <select style={{ width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }} value={source} onChange={(e) => setSource(e.target.value)}>
              <option value="">Tất cả bộ của tôi</option>
              <option value="SO_TAY">Sổ tay từ khó</option>
              {myDecks?.map(deck => (
                <option key={deck.id} value={\`deck:\${deck.id}\`}>{deck.name} ({deck.cardCount} thẻ)</option>
              ))}
            </select>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)', marginTop: 'var(--space-1)' }}>Phân biệt cặp dễ nhầm chỉ dùng các cặp bạn từng chọn nhầm.</p>
          </fieldset>

          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ fontWeight: 'bold', marginBottom: 'var(--space-3)' }}>Số câu</legend>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
              {[5, 10, 20].map(m => (
                <label key={m} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: soCau === m ? 'var(--color-primary-tint)' : 'transparent', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <input type="radio" name="soCau" value={m} checked={soCau === m} onChange={() => setSoCau(m)} style={{ marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{m} câu</div>
                    <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>khoảng {m === 5 ? 3 : m === 10 ? 6 : 12} phút</div>
                  </div>
                </label>
              ))}
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)', marginTop: 'var(--space-2)' }}>Nếu nguồn có ít thẻ hơn, đề sẽ ngắn hơn. Với ghép từ, mỗi câu gồm tối đa 5 cặp.</p>
          </fieldset>

          <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '2px solid var(--color-primary-tint)' }}>
            <Button type="submit" variant="primary" size="lg" disabled={sessionMutation.isPending}>
              {sessionMutation.isPending ? 'Đang tạo đề...' : 'Làm bài'}
            </Button>
            <Button variant="secondary" type="button" onClick={() => router.push('/luyen-tap-lich-su')}>Xem lịch sử bài làm</Button>
          </div>
        </form>
      </section>

      <aside style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Bài gần đây</h2>
          {history?.items?.length > 0 ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-3)' }}>
              {history.items.map(h => (
                <li key={h.baiLuyenId} style={{ borderBottom: '1px dashed var(--color-border)', paddingBottom: 'var(--space-3)' }}>
                  <Link href={\`/luyen-tap-ket-qua?id=\${h.baiLuyenId}\`} style={{ fontWeight: 'bold', color: 'var(--color-primary-strong)', textDecoration: 'none' }}>
                    {TYPES.find(t => t.id === h.loaiBai)?.name || h.loaiBai} {h.laLuyenLai && '(luyện lại)'}
                  </Link>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginTop: '4px' }}>
                    <span>Đúng {h.soCauDung}/{h.tongSoCau}</span>
                    <span>{new Date(h.nopAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>Bạn chưa làm bài nào.</p>
          )}
          <Link href="/luyen-tap-lich-su" style={{ display: 'inline-block', marginTop: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-strong)' }}>Tất cả bài làm &rarr;</Link>
        </section>

        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Luyện từ hay sai</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
            Chọn nguồn <strong>Sổ tay từ khó</strong> để luyện các từ bạn sai nhiều hoặc tự đánh dấu.
          </p>
          <Link href="/so-tay" style={{ display: 'inline-block', marginTop: 'var(--space-3)', fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-strong)' }}>Mở sổ tay &rarr;</Link>
        </section>
      </aside>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <PracticeForm />
    </Suspense>
  );
}
