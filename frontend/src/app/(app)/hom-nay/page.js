'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon, ErrorState } from '@/components/ui';
import styles from './page.module.css';

export default function TodayPage() {
  const router = useRouter();
  const [chieuHoc, setChieuHoc] = useState('EN_VI');
  const [minutes, setMinutes] = useState(10);

  const { data: plan, isLoading, error, refetch } = useQuery({
    queryKey: ['learning-today'],
    queryFn: () => apiFetch('/api/v1/learning/today')
  });

  const sessionMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/learning/sessions', {
      method: 'POST',
      body: JSON.stringify(body)
    }),
    onSuccess: (res) => {
      router.push(`/hoc-phien?id=${res.id}`);
    }
  });

  const handleStart = (e) => {
    e.preventDefault();
    sessionMutation.mutate({
      boTheId: null,
      chieuHoc,
      quyThoiGian: Number(minutes)
    });
  };

  const todayStr = plan?.ngay ? plan.ngay.split('-').reverse().join('/') : '';
  const totalCardsToday = (plan?.soQuaHan || 0) + (plan?.soDenHan || 0) + (plan?.soMoiConLai || 0);

  return (
    <div className="page page-grid with-side today-page" data-view={isLoading ? 'loading' : error ? 'error' : 'ready'}>
      {isLoading && (
        <div data-when="loading">
          <div className="sheet">
            <div className="skeleton">
              <div className="sk sk-title"></div>
              <div className="sk sk-line"></div>
              <div className="sk sk-row"></div>
              <div className="sk sk-row"></div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <section className="sheet" data-when="error">
          <ErrorState title="Chưa tải được kế hoạch học" description={error.message} onRetry={refetch} />
        </section>
      )}

      {!isLoading && !error && (plan?.tongSoThe === 0) && (
        <section className="sheet" data-when="empty" aria-labelledby="empty-title">
          <div className="form-head">
            <div className="form-code"><span>Hôm nay</span><span>{todayStr}</span></div>
            <h1 id="empty-title">Hôm nay học gì?</h1>
          </div>
          <div className="empty">
            <div className="empty-sheet" aria-hidden="true">
              <span data-n="1"><i></i><i></i><i></i><i></i></span>
              <span data-n="2"><i></i><i></i><i></i><i></i></span>
              <span data-n="3"><i></i><i></i><i></i><i></i></span>
            </div>
            <h2>Bạn chưa có thẻ nào để học</h2>
            <p>Sao chép một bộ mẫu trong thư viện hoặc tự tạo bộ thẻ. Kế hoạch hôm nay sẽ hiện ở đây.</p>
            <div className="row">
              <Link className="btn btn-primary" href="/thu-vien">Xem thư viện</Link>
              <Link className="btn btn-secondary" href="/bo-the/tao">Tạo bộ thẻ</Link>
            </div>
          </div>
        </section>
      )}

      {!isLoading && !error && plan?.tongSoThe > 0 && (
        <>
          <section className="sheet" data-when="ready" aria-labelledby="page-title">
            <div className="form-head">
              <div className="form-code"><span>Hôm nay</span><span>{todayStr}</span></div>
              <h1 id="page-title" tabIndex={-1}>Hôm nay học gì?</h1>
              <p id="lead">
                {totalCardsToday === 0
                  ? 'Không còn thẻ nào cần học hôm nay.'
                  : `Có ${(plan?.soQuaHan || 0) + (plan?.soDenHan || 0)} thẻ cần ôn và ${plan?.soMoiConLai || 0} từ mới, cần khoảng ${plan?.uocTinhPhut || 0} phút (ước tính).`}
              </p>
            </div>

            <div id="normal">
              {sessionMutation.error && (
                <p className="notice notice-danger study-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>
                  {sessionMutation.error.message || 'Chưa bắt đầu được phiên học. Hãy thử lại.'}
                </p>
              )}

              <dl className="tally cols-2" id="tally">
                <div>
                  <dt>Quá hạn<small>trễ từ hôm trước</small></dt>
                  <dd><span className="tally-n">{plan?.soQuaHan || 0}</span>thẻ</dd>
                </div>
                <div>
                  <dt>Đến hạn hôm nay</dt>
                  <dd><span className="tally-n">{plan?.soDenHan || 0}</span>thẻ</dd>
                </div>
                <div>
                  <dt>Từ mới còn lại<small>đã học {plan?.soTheMoiDaHoc || 0}/{plan?.tuMoiMoiNgay || 0} từ mới hôm nay</small></dt>
                  <dd><span className="tally-n">{plan?.soMoiConLai || 0}</span>từ</dd>
                </div>
                <div>
                  <dt>Thời gian cần<small>ước tính {plan?.giayMoiLuot || 20} giây mỗi lượt</small></dt>
                  <dd><span className="tally-n">{plan?.uocTinhPhut || 0}</span>phút</dd>
                </div>
              </dl>

              {totalCardsToday === 0 ? (
                <div className={`${styles.done} today-done`} style={{ marginTop: 'var(--space-6)' }}>
                  <p className="notice notice-success">
                    <Icon name="check" />
                    <span>
                      <strong>Hôm nay đã ôn xong.</strong> Không còn thẻ đến hạn và đã đủ từ mới theo thiết lập. Thẻ chưa đến hạn sẽ được giữ cho những phiên học sau.
                    </span>
                  </p>
                  <div className="row" style={{ marginTop: 'var(--space-4)' }}>
                    <Link className="btn btn-primary" href="/luyen-tap">Làm một bài luyện</Link>
                    <Link className="btn btn-secondary" href="/so-tay">Xem sổ tay từ khó</Link>
                  </div>
                </div>
              ) : (
                <form className={`${styles.start} today-plan`} onSubmit={handleStart} noValidate style={{ marginTop: 'var(--space-6)' }}>
                  <fieldset className="fieldset">
                    <legend>Hôm nay bạn có bao nhiêu phút?</legend>
                    <div className="choice-grid cols-3">
                      {[5, 10, 20].map((v) => (
                        <label key={v} className="choice choice-card">
                          <input
                            type="radio"
                            name="minutes"
                            value={v}
                            checked={minutes === v}
                            onChange={() => setMinutes(v)}
                          />
                          <span className="bubble" aria-hidden="true"></span>
                          <span className="choice-body">
                            <span className="choice-title">{v} phút</span>
                            <span className="choice-desc">
                              khoảng {Math.floor((v * 60) / (plan?.giayMoiLuot || 20))} lượt
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend>Chiều học</legend>
                    <div className="choice-grid cols-2">
                      <label className="choice choice-card">
                        <input
                          type="radio"
                          name="chieuHoc"
                          value="EN_VI"
                          checked={chieuHoc === 'EN_VI'}
                          onChange={() => setChieuHoc('EN_VI')}
                        />
                        <span className="bubble" aria-hidden="true"></span>
                        <span className="choice-body">
                          <span className="choice-title">Anh → Việt</span>
                          <span className="choice-desc">Thấy từ tiếng Anh, nhớ lại nghĩa</span>
                        </span>
                      </label>
                      <label className="choice choice-card">
                        <input
                          type="radio"
                          name="chieuHoc"
                          value="VI_EN"
                          checked={chieuHoc === 'VI_EN'}
                          onChange={() => setChieuHoc('VI_EN')}
                        />
                        <span className="bubble" aria-hidden="true"></span>
                        <span className="choice-body">
                          <span className="choice-title">Việt → Anh</span>
                          <span className="choice-desc">Thấy nghĩa, nhớ lại từ tiếng Anh</span>
                        </span>
                      </label>
                    </div>
                  </fieldset>

                  <div className={`${styles.startFoot} start-foot`} style={{ marginTop: 'var(--space-6)' }}>
                    <Button type="submit" variant="accent" size="lg" disabled={sessionMutation.isPending}>
                      {sessionMutation.isPending ? 'Đang tạo phiên…' : 'Bắt đầu phiên hôm nay'}
                    </Button>
                    <Link className="btn btn-quiet" href="/hoc">Tự chọn bộ và thời gian</Link>
                  </div>
                </form>
              )}
            </div>
          </section>

          <aside className="side-col" data-when="ready">
            <section className="panel" aria-labelledby="streak-title">
              <h2 className="panel-title" id="streak-title">Chuỗi ngày học</h2>
              <p className={styles.streak}>
                <span className={styles.tallyN}>{plan?.chuoiNgay || 0}</span>
                <span>ngày liên tiếp</span>
              </p>
              <p className="small muted">
                {plan?.homNayDaTinhChuoi ? 'Hôm nay đã được tính. ' : 'Hôm nay chưa được tính. '}
                Một ngày được tính khi bạn hoàn thành một phiên có ít nhất {plan?.luotToiThieuChuoi || 5} lượt ôn.
              </p>
            </section>

            <section className="panel" aria-labelledby="goal-title">
              <h2 className="panel-title" id="goal-title">Mục tiêu mỗi ngày</h2>
              <p className={styles.goalLine}>
                <span>Đã học {plan?.daHocHomNay?.soLuot || 0} lượt hôm nay</span>
                <span className="num">{plan?.daHocHomNay?.soPhut || 0}/{plan?.phutMoiNgay || 10} phút</span>
              </p>
              <div
                className="meter is-progress"
                role="img"
                aria-label={`Đã học ${plan?.daHocHomNay?.soPhut || 0} trên ${plan?.phutMoiNgay || 10} phút mục tiêu`}
                style={{ '--v': Math.min(1, (plan?.daHocHomNay?.soPhut || 0) / (plan?.phutMoiNgay || 10)) }}
              >
                <span></span>
              </div>
              <Link className="btn btn-quiet" href="/ca-nhan/hoc-tap" style={{ margin: 'var(--sp-2) 0 0 -12px' }}>
                Đổi thiết lập học
              </Link>
            </section>

            {plan?.boThe && plan.boThe.length > 0 && (
              <section className="panel" aria-labelledby="decks-title">
                <h2 className="panel-title" id="decks-title">Theo bộ thẻ</h2>
                <ul className={styles.deckMini} role="list">
                  {plan.boThe.map((b) => (
                    <li key={b.boTheId}>
                      <span className={styles.name}>{b.ten}</span>
                      <span className={styles.meta}>
                        <span>{b.soCanOn} thẻ cần ôn</span>
                        <span>{b.soMoi} từ chưa học</span>
                      </span>
                      <span className="row" style={{ gap: 'var(--sp-2)' }}>
                        <Link className="btn btn-secondary btn-sm" href={`/hoc?boTheId=${b.boTheId}`}>
                          Học bộ này
                        </Link>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <nav className={`panel ${styles.links}`} aria-label="Liên kết nhanh">
              <Link className="btn btn-quiet" href="/thong-ke">Xem thống kê học tập</Link>
              <Link className="btn btn-quiet" href="/bo-the">Bộ của tôi</Link>
            </nav>
          </aside>
        </>
      )}
    </div>
  );
}