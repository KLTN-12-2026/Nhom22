'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon } from '@/components/ui';

const PRACTICE_LABELS = {
  CHON_NGHIA: 'Chọn nghĩa',
  CHON_TU: 'Chọn từ',
  GHEP_TU: 'Ghép từ',
  DIEN_CHO_TRONG: 'Điền chỗ trống',
  NHAP_TU_THEO_NGHIA: 'Nhập từ theo nghĩa',
  NGHE_VIET: 'Nghe viết',
  PHAN_BIET_CAP: 'Phân biệt cặp dễ nhầm',
  TONG_HOP: 'Tổng hợp'
};

const SKILL_LABELS = {
  NHAN_NGHIA: 'Nhận nghĩa',
  DUNG_TU: 'Dùng từ trong câu',
  VIET_DUNG: 'Viết đúng chính tả',
  NGHE_VIET: 'Nghe và viết',
  PHAN_BIET_CAP: 'Phân biệt cặp dễ nhầm'
};

const ERROR_LABELS = {
  NGHIA: 'Nghĩa',
  CHINH_TA: 'Chính tả',
  NGHE: 'Nghe',
  CAP_DE_NHAM: 'Cặp dễ nhầm'
};

function PracticeResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [onlyWrong, setOnlyWrong] = useState(false);

  const { data: session, isLoading, error } = useQuery({
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

  if (!id) return <main className="page"><section className="sheet error-state"><h1>Không tìm thấy bài luyện</h1><Button variant="secondary" onClick={() => router.push('/luyen-tap')}>Về Luyện tập</Button></section></main>;
  if (isLoading) return <main className="page"><section className="sheet"><div className="skeleton"><div className="sk sk-title" /><div className="sk sk-row" /><div className="sk sk-row" /></div></section></main>;
  if (error) return <main className="page"><section className="sheet error-state"><h1>Không mở được kết quả</h1><p>{error.message}</p><Button variant="secondary" onClick={() => router.push('/luyen-tap')}>Về Luyện tập</Button></section></main>;

  if (session && !session.daNop) {
    return (
      <div className="page page-grid">
        <section className="sheet" aria-labelledby="open-title">
          <div className="form-head"><div className="form-code"><span>Kết quả</span><span>Chưa nộp</span></div><h1 id="open-title">Bài này chưa được nộp</h1><p>Mở lại bài để làm tiếp. Đáp án chỉ hiện sau khi nộp.</p></div>
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

    const explain = r.giaiThich;
    if (r.loaiCau === 'GHEP_TU' && explain?.cap) {
      const correctPairs = explain.cap.filter(pair => pair.dung).length;
      return (
        <section key={r.thuTu} className="q-row" data-ok={r.dung}>
          <span className="q-no">{r.thuTu}</span>
          <div className="q-body">
            <div className="verdict">
              <span className="q-kind">Ghép từ</span>
              <span className={r.dung ? 'stamp stamp-success' : 'stamp stamp-danger'}><Icon name={r.dung ? 'check' : 'x'} />{r.dung ? 'Đúng' : 'Sai'}</span>
              <span className="small muted">{correctPairs}/{explain.cap.length} cặp đúng</span>
            </div>
            <table className="pairs"><thead><tr><th>Từ</th><th>Bạn ghép</th><th>Nghĩa đúng</th></tr></thead><tbody>
              {explain.cap.map(pair => (
                <tr key={pair.tu}>
                  <td className="en" lang="en">{pair.tu}</td>
                  <td>{pair.nghiaDaChon || <em>Để trống</em>}{!pair.dung && <span className="stamp stamp-danger">Sai</span>}</td>
                  <td>{pair.nghiaDung}</td>
                </tr>
              ))}
            </tbody></table>
          </div>
        </section>
      );
    }

    return (
      <section key={r.thuTu} className="q-row" data-ok={r.dung}>
        <span className="q-no">{r.thuTu}</span>
        <div className="q-body">
          <div className="verdict">
            <span className="q-kind">{PRACTICE_LABELS[r.loaiCau] || r.loaiCau}</span>
            {r.dung ? (
              <span className="stamp stamp-success"><Icon name="check" /> Đúng</span>
            ) : (
              <span className="stamp stamp-danger"><Icon name="x" /> Sai</span>
            )}
            {r.nhomLoi && (
              <span className="stamp stamp-quiet">Lỗi {ERROR_LABELS[r.nhomLoi] || r.nhomLoi}</span>
            )}
          </div>
          
          <div>{promptHtml}</div>
          
          <dl className="cmp">
            <div><dt>Bạn trả lời</dt><dd className={!r.dung ? 'answer-wrong' : ''}>{r.traLoi?.noiDung || <em>Để trống</em>}</dd></div>
            
            {!r.dung && (
              <div><dt>Đáp án</dt><dd className="answer-correct">{r.dapAn?.noiDung || <em>—</em>}</dd></div>
            )}
          </dl>
          
          {explain && (
            <div className="explain">
              <p><span className="entry-word" lang="en">{explain.tu}</span> {explain.phienAm && <span className="ipa" lang="en">{explain.phienAm}</span>} {explain.tuLoai && <span className="pos" lang="en">{explain.tuLoai}</span>}</p>
              <p>{explain.nghiaVi}</p>
              {explain.viDuEn && <><p className="en" lang="en">{explain.viDuEn}</p>{explain.dichVi && <p className="small muted">{explain.dichVi}</p>}</>}
            </div>
          )}
        </div>
      </section>
    );
  };

  return (
    <div className="page page-grid with-side">
      <section className="sheet" aria-labelledby="page-title">
        <div className="form-head">
          <div className="form-code"><span>Kết quả</span><span>{PRACTICE_LABELS[A.loaiBai] || A.loaiBai}{A.laLuyenLai ? ', luyện lại' : ''}</span></div>
          <h1 id="page-title">Đúng {A.soCauDung}/{A.tongSoCau} câu</h1>
          <p>{A.boTheTen}. Nộp lúc {new Date(A.nopAt).toLocaleString('vi-VN')}.</p>
        </div>

        <dl className="tally cols-2">
          <div><dt>Điểm<small>ghép từ tính theo từng cặp</small></dt><dd><span className="tally-n">{A.diem}</span>/100</dd></div>
          <div><dt>Thời gian</dt><dd>{Math.floor(A.thoiGianMs / 60000)} phút {Math.floor((A.thoiGianMs % 60000) / 1000)} giây</dd></div>
          <div><dt>Câu đúng</dt><dd><span className="tally-n">{A.soCauDung}</span> câu</dd></div>
          <div><dt>Câu sai</dt><dd><span className="tally-n">{wrongCount}</span> câu</dd></div>
        </dl>

        <label className="choice filter">
          <input type="checkbox" checked={onlyWrong} onChange={(e) => setOnlyWrong(e.target.checked)} />
          <span className="bubble box" aria-hidden="true"><Icon name="check" className="box-check" /></span>
          <span className="choice-body"><span className="choice-title">Chỉ xem câu sai</span></span>
        </label>

        <div style={{ marginBottom: 'var(--space-6)' }}>
          {A.ketQua.map(renderResultRow)}
        </div>

        <div className="foot">
          {wrongCount > 0 && (
            <Button variant="accent" size="lg" onClick={() => retryMutation.mutate(A.lanLamId)} loading={retryMutation.isPending}>
              {retryMutation.isPending ? 'Đang tạo bài...' : `Luyện lại ${wrongCount} câu sai`}
            </Button>
          )}
          <Button variant="secondary" onClick={() => router.push('/luyen-tap')}>Làm bài khác</Button>
          <Button variant="ghost" onClick={() => router.push('/luyen-tap-lich-su')}>Lịch sử bài làm</Button>
        </div>
      </section>

      <aside className="side-col">
        <section className="panel" aria-labelledby="skill-title">
          <h2 className="panel-title" id="skill-title">Theo kỹ năng trong bài này</h2>
          <dl className="skills">
            {A.theoKyNang?.map(k => (
              <div key={k.kyNang}><dt><span>{SKILL_LABELS[k.kyNang] || k.kyNang}</span><span className="num">{k.dung}/{k.tong}</span></dt><dd><div className="meter" role="img" aria-label={`${k.dung} trên ${k.tong} câu đúng`} style={{ '--v': k.tong ? k.dung / k.tong : 0 }}><span /></div></dd></div>
            ))}
          </dl>
        </section>

        <section className="panel" aria-labelledby="notebook-title">
          <h2 className="panel-title" id="notebook-title">Câu sai đi đâu?</h2>
          <p className="small muted">
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
