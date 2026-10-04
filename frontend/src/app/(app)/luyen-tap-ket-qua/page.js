'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

function PracticeResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [onlyWrong, setOnlyWrong] = useState(false);

  const { data: session, isLoading } = useQuery({
    queryKey: ['practice-session-result', id],
    queryFn: () => apiFetch(`/api/v1/practice/sessions/${id}`),
    enabled: !!id
  });

  const retryMutation = useMutation({
    mutationFn: (lanLamId) => apiFetch('/api/v1/practice/mistakes/retry', { method: 'POST', body: JSON.stringify({ lanLamId }) }),
    onSuccess: (res) => {
      router.push(`/luyen-tap-lam-bai?id=${res.id}`);
    },
    onError: (err) => alert(err.message || 'Lỗi khi luyện lại')
  });

  if (!id) return <div>Invalid Session</div>;
  if (isLoading) return <div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải kết quả...</div>;

  if (session && !session.daNop) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid">
        <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
              <span>Kết quả</span> <span>&bull;</span> <span>Chưa nộp</span>
            </div>
            <h1 style={{ fontSize: 'var(--font-size-2xl)', marginBottom: 'var(--space-2)' }}>Bài này chưa được nộp</h1>
            <p style={{ color: 'var(--color-ink-2)' }}>Mở lại bài để làm tiếp. Đáp án chỉ hiện sau khi nộp.</p>
          </div>
          <Button variant="primary" onClick={() => router.push(`/luyen-tap-lam-bai?id=${id}`)}>Làm tiếp</Button>
        </section>
      </div>
    );
  }

  const A = session?.ketQua;
  if (!A) return <div style={{ padding: 'var(--space-8)' }}>Không có dữ liệu kết quả</div>;

  const wrongCount = A.tongSoCau - A.soCauDung;

  const renderResultRow = (r) => {
    if (onlyWrong && r.dung) return null;

    let promptHtml = '';
    if (r.loaiCau === 'CHON_NGHIA') promptHtml = <div style={{ fontWeight: 'bold', fontSize: '1.2rem', fontFamily: 'var(--font-word)' }}>{r.deBai.tu}</div>;
    else if (r.loaiCau === 'CHON_TU' || r.loaiCau === 'NHAP_TU_THEO_NGHIA') promptHtml = <div style={{ fontWeight: 'bold' }}>{r.deBai.nghiaVi}</div>;
    else if (r.deBai.cau) {
      const sentenceHtml = r.deBai.cau.replace('_____', '<span style="display:inline-block; width:40px; border-bottom:2px solid var(--color-ink); margin:0 4px;">?</span>');
      promptHtml = <div dangerouslySetInnerHTML={{ __html: sentenceHtml }} />;
    } else {
      promptHtml = <div>{r.deBai.goiY || 'Prompt'}</div>;
    }

    return (
      <section key={r.thuTu} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-5) 0', borderBottom: '1px dashed var(--color-border)' }}>
        <div style={{ fontWeight: 'bold', color: 'var(--color-ink-3)', marginTop: '4px' }}>{r.thuTu}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'bold', color: 'var(--color-primary)', textTransform: 'uppercase' }}>{r.loaiCau.replace(/_/g, ' ')}</span>
            {r.dung ? (
              <span style={{ padding: '2px 8px', background: 'var(--color-success-bg)', color: 'var(--color-success-text)', borderRadius: '4px', fontSize: 'var(--font-size-xs)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="check" size={12} /> Đúng</span>
            ) : (
              <span style={{ padding: '2px 8px', background: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', borderRadius: '4px', fontSize: 'var(--font-size-xs)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><Icon name="x" size={12} /> Sai</span>
            )}
            {r.nhomLoi && (
              <span style={{ padding: '2px 8px', background: 'var(--color-border)', borderRadius: '4px', fontSize: 'var(--font-size-xs)', fontWeight: 'bold' }}>Lỗi {r.nhomLoi}</span>
            )}
          </div>
          
          <div style={{ marginBottom: 'var(--space-3)' }}>{promptHtml}</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
            <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>Bạn trả lời</div>
            <div style={!r.dung ? { color: 'var(--color-danger)', fontWeight: 'bold' } : {}}>{r.traLoi?.noiDung || <em style={{ color: 'var(--color-ink-3)' }}>Để trống</em>}</div>
            
            {!r.dung && (
              <>
                <div style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>Đáp án</div>
                <div style={{ color: 'var(--color-success-strong)', fontWeight: 'bold' }}>{r.dapAn?.noiDung}</div>
              </>
            )}
          </div>
          
          {r.giaiThich && (
            <div style={{ borderLeft: '4px solid var(--color-primary-tint)', paddingLeft: 'var(--space-3)', background: 'var(--color-bg)', padding: 'var(--space-3)' }}>
              <div style={{ fontWeight: 'bold', fontFamily: 'var(--font-word)' }}>{r.giaiThich.tu} {r.giaiThich.phienAm && <span style={{ color: 'var(--color-ink-2)', fontSize: '0.9em', fontWeight: 'normal' }}>{r.giaiThich.phienAm}</span>}</div>
              <div style={{ fontSize: 'var(--font-size-sm)' }}>{r.giaiThich.nghiaVi}</div>
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-5)', alignItems: 'start' }} className="page-grid with-side">
      <section className="sheet" style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)', marginBottom: 'var(--space-2)' }}>
            <span>Kết quả</span> <span>&bull;</span> <span>{A.loaiBai}{A.laLuyenLai ? ', luyện lại' : ''}</span>
          </div>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', marginBottom: 'var(--space-2)' }}>Đúng {A.soCauDung}/{A.tongSoCau} câu</h1>
          <p style={{ color: 'var(--color-ink-2)' }}>{A.boTheTen}. Nộp lúc {new Date(A.nopAt).toLocaleString('vi-VN')}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <div style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)', textTransform: 'uppercase', fontWeight: 'bold' }}>Điểm</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{A.diem}<span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--color-ink-2)' }}>/100</span></div>
          </div>
          <div style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)', textTransform: 'uppercase', fontWeight: 'bold' }}>Thời gian</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{Math.floor(A.thoiGianMs / 60000)}p {Math.floor((A.thoiGianMs % 60000) / 1000)}s</div>
          </div>
          <div style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)', textTransform: 'uppercase', fontWeight: 'bold' }}>Câu đúng</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-success-strong)' }}>{A.soCauDung}</div>
          </div>
          <div style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-ink-2)', textTransform: 'uppercase', fontWeight: 'bold' }}>Câu sai</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-danger)' }}>{wrongCount}</div>
          </div>
        </div>

        <div style={{ marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} />
            Chỉ xem câu sai
          </label>
        </div>

        <div style={{ marginBottom: 'var(--space-6)' }}>
          {A.ketQua.map(renderResultRow)}
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', paddingTop: 'var(--space-4)', borderTop: '2px solid var(--color-primary-tint)' }}>
          {wrongCount > 0 && (
            <Button variant="primary" size="lg" onClick={() => retryMutation.mutate(A.lanLamId)} disabled={retryMutation.isPending}>
              {retryMutation.isPending ? 'Đang tạo bài...' : `Luyện lại ${wrongCount} câu sai`}
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.push('/luyen-tap')}>Làm bài khác</Button>
          <Button variant="ghost" onClick={() => router.push('/luyen-tap-lich-su')}>Lịch sử</Button>
        </div>
      </section>

      <aside style={{ display: 'grid', gap: 'var(--space-5)' }}>
        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Theo kỹ năng trong bài</h2>
          <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
            {A.theoKyNang?.map(k => (
              <div key={k.kyNang}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-1)' }}>
                  <span style={{ fontWeight: 'bold' }}>{k.kyNang}</span>
                  <span style={{ fontWeight: 'bold' }}>{k.dung}/{k.tong}</span>
                </div>
                <div style={{ height: '6px', background: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: 'var(--color-primary)', width: `${(k.dung / k.tong) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ backgroundColor: 'var(--color-field)', padding: 'var(--space-5)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-3)' }}>Câu sai đi đâu?</h2>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-ink-2)' }}>
            Mỗi câu sai được lưu với nhóm lỗi (nghĩa, chính tả, nghe, cặp dễ nhầm) và hiện trong <Link href="/so-tay" style={{ color: 'var(--color-primary-strong)' }}>Sổ tay</Link>. 
            Bài luyện không tự đổi lịch ôn thẻ.
          </p>
        </section>
      </aside>
    </div>
  );
}

export default function PracticeResultPage() {
  return (
    <Suspense fallback={<div style={{ padding: 'var(--space-8)', textAlign: 'center' }}>Đang tải...</div>}>
      <PracticeResultContent />
    </Suspense>
  );
}
