'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon, ErrorState } from '@/components/ui';
import styles from './page.module.css';

export default function TodayPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [chieuHoc, setChieuHoc] = useState('EN_VI');
  const [minutes, setMinutes] = useState(10);
  const [rescueMinutes, setRescueMinutes] = useState(null);
  const [keepNewCards, setKeepNewCards] = useState(false);
  
  const { data: plan, isLoading, error, refetch } = useQuery({
    queryKey: ['learning-today', rescueMinutes, keepNewCards],
    queryFn: () => {
      const params = new URLSearchParams();
      if (rescueMinutes) params.set('phut', String(rescueMinutes));
      if (keepNewCards) params.set('giuTuMoi', 'true');
      const query = params.toString();
      return apiFetch(`/api/v1/learning/today${query ? `?${query}` : ''}`);
    }
  });

  const decks = plan?.boThe || [];
  const { data: progressByDeck, isFetching: isCheckingProgress } = useQuery({
    queryKey: ['today-session-availability', decks.map(deck => deck.boTheId)],
    enabled: decks.length > 0,
    queryFn: async () => {
      const entries = await Promise.all(decks.map(async deck => {
        const progress = await apiFetch(`/api/v1/decks/${encodeURIComponent(deck.boTheId)}/progress?size=1000&page=0`);
        return [String(deck.boTheId), progress];
      }));
      return Object.fromEntries(entries);
    },
    staleTime: 30 * 1000
  });

  const availableForDirection = (direction) => decks.reduce((total, deck) => {
    const progress = progressByDeck?.[String(deck.boTheId)];
    return total + (progress?.items?.filter(item => {
      const state = item.chieu?.[direction]?.nhom;
      return state === 'MOI' || state === 'DEN_HAN' || state === 'QUA_HAN';
    }).length || 0);
  }, 0);

  const selectedDirectionAvailable = availableForDirection(chieuHoc);

  const sessionMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/learning/sessions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (res) => {
      router.push(`/hoc-phien?id=${res.id}`);
    }
  });

  const viewState = isLoading
    ? 'loading'
    : error
      ? 'error'
      : plan?.tongSoThe === 0
        ? 'empty'
        : 'ready';

  useEffect(() => {
    if (!plan?.phutMoiNgay) return;
    setMinutes([5, 10, 20].reduce((closest, value) =>
      Math.abs(value - plan.phutMoiNgay) < Math.abs(closest - plan.phutMoiNgay) ? value : closest
    , 10));
  }, [plan?.phutMoiNgay]);

  const handleStart = (e) => {
    e.preventDefault();
    if (progressByDeck && selectedDirectionAvailable === 0) {
      return;
    }
    sessionMutation.mutate({
      boTheId: null,
      chieuHoc,
      quyThoiGian: minutes,
      cheDo: 'THUONG'
    });
  };

  const handleRescueStart = (e) => {
    e.preventDefault();
    if (progressByDeck && selectedDirectionAvailable === 0) {
      return;
    }
    const r = plan?.cuuLichOn;
    sessionMutation.mutate({
      boTheId: null,
      chieuHoc,
      quyThoiGian: rescueMinutes || r?.phutMoiNgay || 10,
      cheDo: 'CUU_LICH'
    });
  };

  const todayStr = new Date().toLocaleDateString('vi-VN');

  return (
    <div className="page page-grid with-side today-page" data-view={viewState} aria-busy={isLoading}>
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
      
      {error && <section className="sheet" data-when="error"><ErrorState title="Chưa tải được kế hoạch học" description={error.message} onRetry={refetch} /></section>}

      {!isLoading && !error && (plan?.tongSoThe === 0) && (
        <section className="sheet" data-when="empty" aria-labelledby="empty-title">
          <div className="form-head">
            <div className="form-code"><span>Hôm nay</span><span>{todayStr}</span></div>
            <h1 id="empty-title">Hôm nay học gì?</h1>
          </div>
          <div className="empty">
            <div className="empty-sheet" aria-hidden="true"><span data-n="1"><i></i><i></i><i></i><i></i></span><span data-n="2"><i></i><i></i><i></i><i></i></span><span data-n="3"><i></i><i></i><i></i><i></i></span></div>
            <h2>Bạn chưa có thẻ nào để học</h2>
            <p>Sao chép một bộ mẫu trong thư viện hoặc tự tạo bộ thẻ. Kế hoạch hôm nay sẽ hiện ở đây.</p>
            <div className="row">
              <Link className="btn btn-primary" href="/thu-vien">Xem thư viện</Link>
              <Link className="btn btn-secondary" href="/bo-the/tao">Tạo bộ thẻ</Link>
            </div>
          </div>
        </section>
      )}

      {!isLoading && !error && (plan?.tongSoThe > 0 || plan === null) && (
        <>
          <section className="sheet" data-when="ready" aria-labelledby="page-title">
            <div className="form-head">
              <div className="form-code"><span>Hôm nay</span><span>{todayStr}</span></div>
              <h1 id="page-title" tabIndex="-1">Hôm nay học gì?</h1>
              <p id="lead">
                {plan?.cuuLichOn ? "Bạn nghỉ một thời gian nên có nhiều thẻ trễ hạn. Không cần ôn hết trong một ngày." : 
                 (plan?.soQuaHan + plan?.soDenHan + plan?.soMoiConLai === 0) ? "Không còn thẻ nào cần học hôm nay." : 
                 `Có ${plan?.soQuaHan + plan?.soDenHan} thẻ cần ôn và ${plan?.soMoiConLai} từ mới, cần khoảng ${plan?.uocTinhPhut} phút (ước tính).`}
              </p>
            </div>

            {searchParams.get('welcome') === '1' && (
              <p className="notice notice-success" role="status">
                <Icon name="check" />
                <span>Đã lưu thiết lập học. Chọn thời gian bên dưới rồi bắt đầu phiên học đầu tiên.</span>
              </p>
            )}

            {plan?.cuuLichOn ? (
              <section className={styles.rescue} aria-labelledby="rescue-title">
                {sessionMutation.error && <p className="notice notice-danger study-error" role="alert">{sessionMutation.error.message}</p>}
                <h2 id="rescue-title" style={{ fontSize: 'var(--fs-h3)' }}>Kế hoạch học lại sau thời gian nghỉ</h2>
                <p className={styles.rescueLead} id="rescue-lead">
                  Có <strong>{plan.cuuLichOn.soTheCanOn}</strong> thẻ cần ôn; hôm nay bạn có <strong>{plan.cuuLichOn.phutMoiNgay}</strong> phút. Chia thành {plan.cuuLichOn.soNgay} ngày là vừa sức.
                </p>
                <form className="stack" onSubmit={handleRescueStart}>
                  <fieldset className="fieldset">
                    <legend>Mỗi ngày bạn dành được bao nhiêu phút?</legend>
                    <div className="choice-grid cols-3">
                      {[5, 10, 20].map(v => (
                        <label key={v} className="choice choice-card">
                          <input
                            type="radio"
                            name="rescueMin"
                            value={v}
                            checked={(rescueMinutes ?? minutes) === v}
                            onChange={() => {
                              setRescueMinutes(v);
                              setMinutes(v);
                            }}
                          />
                          <span className="bubble" aria-hidden="true"></span>
                          <span className="choice-body">
                            <span className="choice-title">{v} phút mỗi ngày</span>
                            <span className="choice-desc">khoảng {Math.floor(v * 60 / plan.giayMoiLuot)} lượt</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="fieldset">
                    <legend>Ôn chiều nào trước?</legend>
                    <div className="choice-grid cols-2">
                      <label className="choice choice-card">
                        <input type="radio" name="rescueDir" value="EN_VI" checked={chieuHoc === 'EN_VI'} onChange={() => setChieuHoc('EN_VI')} />
                        <span className="bubble" aria-hidden="true"></span>
                        <span className="choice-body"><span className="choice-title">Anh → Việt</span></span>
                      </label>
                      <label className="choice choice-card">
                        <input type="radio" name="rescueDir" value="VI_EN" checked={chieuHoc === 'VI_EN'} onChange={() => setChieuHoc('VI_EN')} />
                        <span className="bubble" aria-hidden="true"></span>
                        <span className="choice-body"><span className="choice-title">Việt → Anh</span></span>
                      </label>
                    </div>
                  </fieldset>
                  <label className="choice" style={{ marginLeft: 'calc(var(--sp-2) * -1)' }}>
                    <input type="checkbox" name="pauseNew" checked={!keepNewCards} onChange={(event) => {
                      setKeepNewCards(!event.target.checked);
                      setRescueMinutes(rescueMinutes || minutes);
                    }} />
                    <span className="bubble box" aria-hidden="true"><Icon name="check" className="box-check" /></span>
                    <span className="choice-body"><span className="choice-title">Tạm dừng từ mới cho đến khi ôn hết thẻ tồn</span><span className="choice-desc">Thẻ quên nhiều và quá hạn lâu nhất được ôn trước.</span></span>
                  </label>
                </form>
                <div aria-live="polite">
                  <ol className={`answer-list ${styles.planList}`} role="list">
                    {plan.cuuLichOn.keHoach.map((d, i) => (
                      <li key={i} className="answer-row">
                        <span className="answer-no">{i + 1}</span>
                        <div className="answer-main">
                          <span className="answer-title">{i === 0 ? "Hôm nay" : i === 1 ? "Ngày mai" : new Date(d.ngay).toLocaleDateString('vi-VN')}</span>
                          <span className="answer-meta"><span>{new Date(d.ngay).toLocaleDateString('vi-VN')}</span></span>
                        </div>
                        <span className={styles.when}>{d.soThe} thẻ, khoảng {d.phut} phút</span>
                      </li>
                    ))}
                  </ol>
                </div>
                <p className="notice">
                  <Icon name="info" />
                  <span>Đây là ước tính, tính theo khoảng {plan.giayMoiLuot} giây mỗi lượt và sẽ chỉnh theo tốc độ làm bài thực tế. Ngày đến hạn gốc của thẻ vẫn được giữ, nên thống kê vẫn cho thấy đúng số thẻ đang trễ.</span>
                </p>
                <div className={`${styles.startFoot} start-foot`}>
                  {sessionMutation.error && <p className="notice notice-danger study-error" role="alert">{sessionMutation.error.message || 'Chưa bắt đầu được phiên học.'}</p>}
                  {progressByDeck && selectedDirectionAvailable === 0 && (
                    <p className="notice notice-warning" role="status">
                      <Icon name="info" />
                      <span>Chiều {chieuHoc === 'EN_VI' ? 'Anh → Việt' : 'Việt → Anh'} hiện chưa có thẻ khả dụng. Hãy đổi chiều học hoặc chọn bộ khác.</span>
                    </p>
                  )}
                  <Button type="button" onClick={handleRescueStart} variant="accent" size="lg" disabled={sessionMutation.isPending || isCheckingProgress || (progressByDeck && selectedDirectionAvailable === 0)}>
                    {sessionMutation.isPending ? 'Đang tải...' : isCheckingProgress ? 'Đang kiểm tra thẻ...' : 'Bắt đầu phiên hôm nay'}
                  </Button>
                  <Link className="btn btn-quiet" href="/hoc">Tự chọn bộ và thời gian</Link>
                </div>
              </section>
            ) : (
              <div id="normal">
                {sessionMutation.error && <p className="notice notice-danger study-error" role="alert">{sessionMutation.error.message || 'Chưa bắt đầu được phiên học. Hãy thử lại.'}</p>}
                {progressByDeck && selectedDirectionAvailable === 0 && (
                  <p className="notice notice-warning" role="status">
                    <Icon name="info" />
                    <span>Chiều {chieuHoc === 'EN_VI' ? 'Anh → Việt' : 'Việt → Anh'} hiện chưa có thẻ khả dụng. Hãy đổi chiều học hoặc chọn bộ khác.</span>
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
                    <dt>Thời gian cần<small>ước tính {plan?.giayMoiLuot || 0} giây mỗi lượt</small></dt>
                    <dd><span className="tally-n">{plan?.uocTinhPhut || 0}</span>phút</dd>
                  </div>
                </dl>

                {(plan?.soQuaHan || 0) + (plan?.soDenHan || 0) + (plan?.soMoiConLai || 0) === 0 ? (
                  <div className={`${styles.done} today-done`}>
                    <p className="notice notice-success">
                      <Icon name="check" />
                      <span><strong>Hôm nay đã ôn xong.</strong> Không còn thẻ đến hạn và đã đủ từ mới theo thiết lập. Thẻ tiếp theo sẽ đến hạn vào ngày mai.</span>
                    </p>
                    <div className="row">
                      <Link className="btn btn-primary" href="/luyen-tap">Làm một bài luyện</Link>
                      <Link className="btn btn-secondary" href="/so-tay">Xem sổ tay từ khó</Link>
                    </div>
                  </div>
                ) : (
                  <form className={`${styles.start} today-plan`} onSubmit={handleStart} noValidate>
                    <fieldset className="fieldset">
                      <legend>Hôm nay bạn có bao nhiêu phút?</legend>
                      <div className="choice-grid cols-3">
                        {[5, 10, 20].map((v) => (
                          <label key={v} className="choice choice-card">
                            <input type="radio" name="minutes" value={v} checked={minutes === v} onChange={() => setMinutes(v)} />
                            <span className="bubble" aria-hidden="true"></span>
                            <span className="choice-body">
                              <span className="choice-title">{v} phút</span>
                              <span className="choice-desc">khoảng {Math.floor(v * 60 / (plan?.giayMoiLuot || 10))} lượt</span>
                            </span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset className="fieldset">
                      <legend>Chiều học</legend>
                      <div className="choice-grid cols-2">
                        <label className="choice choice-card">
                          <input type="radio" name="chieuHoc" value="EN_VI" checked={chieuHoc === 'EN_VI'} onChange={() => setChieuHoc('EN_VI')} />
                          <span className="bubble" aria-hidden="true"></span>
                          <span className="choice-body">
                            <span className="choice-title">Anh → Việt</span>
                            <span className="choice-desc">Thấy từ tiếng Anh, nhớ lại nghĩa</span>
                          </span>
                        </label>
                        <label className="choice choice-card">
                          <input type="radio" name="chieuHoc" value="VI_EN" checked={chieuHoc === 'VI_EN'} onChange={() => setChieuHoc('VI_EN')} />
                          <span className="bubble" aria-hidden="true"></span>
                          <span className="choice-body">
                            <span className="choice-title">Việt → Anh</span>
                            <span className="choice-desc">Thấy nghĩa, nhớ lại từ tiếng Anh</span>
                          </span>
                        </label>
                      </div>
                    </fieldset>
                    <div className={`${styles.startFoot} start-foot`}>
                      <Button type="submit" variant="accent" size="lg" disabled={sessionMutation.isPending || isCheckingProgress || (progressByDeck && selectedDirectionAvailable === 0)}>
                        {sessionMutation.isPending ? 'Đang tải...' : isCheckingProgress ? 'Đang kiểm tra thẻ...' : 'Bắt đầu học'}
                      </Button>
                      <Link className="btn btn-quiet" href="/hoc">Chọn bộ khác</Link>
                    </div>
                  </form>
                )}
              </div>
            )}
          </section>

          <aside className="side-col" data-when="ready">
            <section className="panel" aria-labelledby="streak-title">
              <h2 className="panel-title" id="streak-title">Chuỗi ngày học</h2>
              <p className={styles.streak}><span className="tally-n">{plan?.chuoiNgay || 0}</span><span>ngày liên tiếp</span></p>
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
                role="progressbar"
                aria-valuemin="0"
                aria-valuemax={plan?.phutMoiNgay || 10}
                aria-valuenow={plan?.daHocHomNay?.soPhut || 0}
                aria-label={`Đã học ${plan?.daHocHomNay?.soPhut || 0} trên ${plan?.phutMoiNgay || 10} phút mục tiêu`}
                style={{ '--v': Math.min(1, (plan?.daHocHomNay?.soPhut || 0) / (plan?.phutMoiNgay || 10)) }}
              >
                <span></span>
              </div>
              <Link className="btn btn-quiet" href="/ca-nhan/hoc-tap" style={{ margin: 'var(--sp-2) 0 0 -12px' }}>Đổi thiết lập học</Link>
            </section>

            {plan?.boThe?.length > 0 && (
              <section className="panel" aria-labelledby="decks-title">
                <h2 className="panel-title" id="decks-title">Theo bộ thẻ</h2>
                <ul className={styles.deckMini} role="list">
                  {plan.boThe.map(b => (
                    <li key={b.boTheId}>
                      <span className={styles.name}>{b.ten}</span>
                      <span className={styles.meta}>
                        <span>{b.soCanOn} thẻ cần ôn</span>
                        <span>{b.soMoi} từ chưa học</span>
                      </span>
                      <span className="row" style={{ gap: 'var(--sp-2)' }}>
                        <Link className="btn btn-secondary btn-sm" href={`/hoc?boTheId=${b.boTheId}`}>Học bộ này</Link>
                        <Link className="btn btn-quiet btn-sm" href={`/bo-the/${b.boTheId}/tien-do`}>Tiến độ</Link>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <nav className={`panel ${styles.links}`} aria-label="Liên kết nhanh">
              <Link className="btn btn-quiet" href="/bo-the">Bộ của tôi</Link>
            </nav>
          </aside>
        </>
      )}
    </div>
  );
}
