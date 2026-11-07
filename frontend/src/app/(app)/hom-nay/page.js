'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { Button, Icon, ErrorState } from '@/components/ui';
import styles from './page.module.css';

const MINUTE_OPTIONS = [5, 10, 20];
const DIR = { EN_VI: 'Anh → Việt', VI_EN: 'Việt → Anh' };
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const nearest = (m) => MINUTE_OPTIONS.reduce((a, b) => (Math.abs(b - m) < Math.abs(a - m) ? b : a), 10);
const addDays = (ymd, n) => new Date(Date.parse(`${ymd}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const fmtDay = (ymd) => (ymd ? `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}` : '');
const fmtTime = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

function MiniBars({ rows, goal, unit, label, forecast }) {
  const max = Math.max(1, goal || 0, ...rows.map((r) => r.v));
  return (
    <>
      <div
        className={`${styles.miniBars} ${forecast ? styles.isForecast : ''}`}
        role="img"
        aria-label={`${label}: ${rows.map((r) => `${fmtDay(r.ngay)} ${r.v} ${unit}`).join('; ')}`}
      >
        {rows.map((r) => (
          <div key={r.ngay} className={styles.miniBar} data-goal={r.met ? '' : undefined} style={{ '--v': (r.v / max).toFixed(3) }} title={`${fmtDay(r.ngay)}: ${r.v} ${unit}`}>
            <b>{r.v}</b><i></i>
          </div>
        ))}
        {goal ? <div className={styles.miniGoal} style={{ '--g': (goal / max).toFixed(3) }}></div> : null}
      </div>
      <div className={styles.miniX} aria-hidden="true">
        {rows.map((r) => (
          <span key={r.ngay} className={r.today ? styles.isToday : undefined}>
            <b>{WEEKDAY[new Date(`${r.ngay}T12:00:00Z`).getUTCDay()]}</b>{fmtDay(r.ngay)}
          </span>
        ))}
      </div>
    </>
  );
}

function WeekBlock({ plan, activity }) {
  const goal = plan.phutMoiNgay || 0;
  const hasActivity = Array.isArray(activity?.theoNgay);
  const hasForecast = Array.isArray(plan.duBaoOn);
  if (!hasActivity && !hasForecast) return null;

  let actRows = [];
  let actSum = '';
  if (hasActivity) {
    actRows = activity.theoNgay.map((x) => ({ ngay: x.ngay, v: x.soPhut, met: x.thoiGian > 0 && x.thoiGian >= goal * 60000, today: x.ngay === plan.ngay }));
    const total = actRows.reduce((a, r) => a + r.v, 0);
    const studied = activity.theoNgay.filter((x) => x.thoiGian > 0 || x.soLuotOn > 0).length;
    const met = actRows.filter((r) => r.met).length;
    actSum = studied ? `Tổng ${total} phút, ${studied}/7 ngày có học, ${met} ngày đạt mục tiêu` : 'Chưa có hoạt động trong 7 ngày qua.';
  }

  let fcRows = [];
  let fcSum = '';
  if (hasForecast) {
    fcRows = plan.duBaoOn.map((x) => ({ ngay: x.ngay, v: x.soCanOn }));
    const total = fcRows.reduce((a, r) => a + r.v, 0);
    const peak = fcRows.reduce((a, r) => (r.v > a.v ? r : a), fcRows[0] || { v: 0 });
    fcSum = total ? `Tổng ${total} lượt; nhiều nhất ${fmtDay(peak.ngay)} (${peak.v} lượt)` : 'Chưa có lượt nào đến hạn trong 7 ngày tới.';
  }

  return (
    <section className={styles.week} aria-labelledby="week-title">
      <h2 id="week-title">Tuần này</h2>
      <div className={styles.weekGrid}>
        {hasActivity && (
          <figure className={styles.mini}>
            <figcaption><span className={styles.miniTitle}>Hoạt động 7 ngày qua</span><span className={styles.miniSum}>{actSum}</span></figcaption>
            <MiniBars rows={actRows} goal={goal} unit="phút" label={`Số phút học 7 ngày qua, mục tiêu ${goal} phút mỗi ngày`} />
            <ul className={styles.miniLegend} aria-hidden="true"><li><i></i>Ngày đạt mục tiêu</li><li><i className={styles.goal}></i>Mục tiêu {goal} phút</li></ul>
            <Link className="btn btn-quiet" href="/thong-ke">Xem thống kê chi tiết</Link>
          </figure>
        )}
        {hasForecast && (
          <figure className={styles.mini}>
            <figcaption><span className={styles.miniTitle}>Dự báo ôn 7 ngày tới</span><span className={styles.miniSum}>{fcSum}</span></figcaption>
            <MiniBars rows={fcRows} unit="lượt" label="Số lượt đến hạn trong 7 ngày tới" forecast />
            <p className="small muted">Mỗi chiều học của một thẻ tính là một lượt. Số có thể tăng khi bạn ôn thêm hôm nay.</p>
          </figure>
        )}
      </div>
    </section>
  );
}

function ResumeBlock({ session, onFinish, finishing, finishError }) {
  const [now] = useState(() => Date.now());
  if (!session) return null;
  const open = session.soChuaTraLoi > 0;
  const total = session.soDaTraLoi + session.soChuaTraLoi;
  const late = open && now > Date.parse(session.hetGioAt);
  return (
    <section className={styles.resume} aria-labelledby="resume-title">
      <div className={styles.resumeHead}>
        <h2 id="resume-title">Phiên đang dở</h2>
        <span className={styles.resumeMeta}>
          {session.boTheTen || 'Tất cả bộ'} · {DIR[session.chieuHoc] || session.chieuHoc} · {session.quyThoiGian} phút, bắt đầu lúc {fmtTime(session.batDauAt)}
        </span>
      </div>
      <p className={styles.goalLine}>
        <span>{open ? `Còn ${session.soChuaTraLoi} thẻ chưa trả lời` : 'Đã trả lời hết thẻ, phiên chưa kết thúc'}</span>
        <span className="num">{session.soDaTraLoi}/{total} thẻ</span>
      </p>
      <div className="meter is-progress" role="img" aria-label={`Đã trả lời ${session.soDaTraLoi} trên ${total} thẻ của phiên`} style={{ '--v': total ? session.soDaTraLoi / total : 0 }}><span></span></div>
      {late && <p className="small muted">Đã quá thời gian dự kiến của phiên. Bạn vẫn làm tiếp được, kết quả vẫn được lưu.</p>}
      {finishError && <p className="notice notice-danger" role="alert">{finishError}</p>}
      <div className="row">
        {open ? (
          <Link className="btn btn-accent" href={`/hoc-phien?id=${session.id}`}>Tiếp tục phiên</Link>
        ) : (
          <Button type="button" variant="primary" onClick={() => onFinish(session.id)} disabled={finishing}>
            {finishing ? 'Đang kết thúc…' : 'Kết thúc và xem tổng kết'}
          </Button>
        )}
      </div>
    </section>
  );
}

function RescueBlock({ rescue, giayMoiLuot, rescueMinutes, setRescueMinutes, pauseNew, setPauseNew, onStart, starting, startError, refreshing }) {
  const [dir, setDir] = useState('EN_VI');
  const current = rescueMinutes ?? rescue.phutMoiNgay;
  return (
    <section className={styles.rescue} aria-labelledby="rescue-title">
      <h2 id="rescue-title" style={{ fontSize: 'var(--fs-h3)' }}>Kế hoạch học lại sau thời gian nghỉ</h2>
      <p className={styles.rescueLead}>
        Có <strong>{rescue.soTheCanOn}</strong> thẻ cần ôn ({rescue.soQuaHan} quá hạn); hôm nay bạn có <strong>{rescue.phutMoiNgay}</strong> phút. Chia thành {rescue.soNgay} ngày là vừa sức.
      </p>
      <form className="stack" onSubmit={(e) => e.preventDefault()}>
        <fieldset className="fieldset">
          <legend>Mỗi ngày bạn dành được bao nhiêu phút?</legend>
          <div className="choice-grid cols-3">
            {MINUTE_OPTIONS.map((v) => (
              <label key={v} className="choice choice-card">
                <input type="radio" name="rescueMin" value={v} checked={current === v} onChange={() => setRescueMinutes(v)} />
                <span className="bubble" aria-hidden="true"></span>
                <span className="choice-body">
                  <span className="choice-title">{v} phút mỗi ngày</span>
                  <span className="choice-desc">khoảng {Math.floor((v * 60) / (giayMoiLuot || 20))} lượt</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="fieldset">
          <legend>Ôn chiều nào trước?</legend>
          <div className="choice-grid cols-2">
            {Object.entries(DIR).map(([k, v]) => (
              <label key={k} className="choice choice-card">
                <input type="radio" name="rescueDir" value={k} checked={dir === k} onChange={() => setDir(k)} />
                <span className="bubble" aria-hidden="true"></span>
                <span className="choice-body"><span className="choice-title">{v}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="choice" style={{ marginLeft: 'calc(var(--sp-2) * -1)' }}>
          <input type="checkbox" name="pauseNew" checked={pauseNew} onChange={(e) => setPauseNew(e.target.checked)} />
          <span className="bubble box" aria-hidden="true"><svg className="box-check" viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg></span>
          <span className="choice-body">
            <span className="choice-title">Tạm dừng từ mới cho đến khi ôn hết thẻ tồn</span>
            <span className="choice-desc">Thẻ quên nhiều và quá hạn lâu nhất được ôn trước.</span>
          </span>
        </label>
      </form>
      <div aria-live="polite" aria-busy={refreshing}>
        <ol className={`answer-list ${styles.planList}`} role="list">
          {rescue.keHoach.map((d, i) => (
            <li key={d.ngay} className="answer-row">
              <span className="answer-no">{i + 1}</span>
              <div className="answer-main">
                <span className="answer-title">{i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : fmtDay(d.ngay)}</span>
                <span className="answer-meta"><span>{d.ngay.split('-').reverse().join('/')}</span></span>
              </div>
              <span className={styles.when}>{d.soThe} thẻ, khoảng {d.phut} phút</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="notice">
        <Icon name="info" />
        <span>Đây là ước tính, tính theo khoảng {giayMoiLuot || 20} giây mỗi lượt và sẽ chỉnh theo tốc độ làm bài thực tế. Ngày đến hạn gốc của thẻ vẫn được giữ, nên thống kê vẫn cho thấy đúng số thẻ đang trễ.</span>
      </p>
      {startError && <p className="notice notice-danger" role="alert">{startError}</p>}
      <div className={`${styles.startFoot} start-foot`}>
        <Button type="button" variant="accent" size="lg" disabled={starting} onClick={() => onStart({ boTheId: null, chieuHoc: dir, quyThoiGian: nearest(rescue.phutMoiNgay), cheDo: rescue.tamDungTuMoi ? 'CUU_LICH' : 'THUONG' })}>
          {starting ? 'Đang tạo phiên…' : 'Bắt đầu phiên hôm nay'}
        </Button>
        <Link className="btn btn-quiet" href="/hoc">Tự chọn bộ và thời gian</Link>
      </div>
    </section>
  );
}

const errorText = (err, fallback) => {
  if (!err) return '';
  const fields = Array.isArray(err.data?.fieldErrors) ? err.data.fieldErrors.map((f) => f.message).filter(Boolean) : [];
  return fields.length ? fields.join(' ') : err.message || fallback;
};

export default function TodayPage() {
  const router = useRouter();
  const [chieuHoc, setChieuHoc] = useState('EN_VI');
  const [minutes, setMinutes] = useState(null);
  const [rescueMinutes, setRescueMinutes] = useState(null);
  const [pauseNew, setPauseNew] = useState(true);

  const params = new URLSearchParams();
  if (rescueMinutes) params.set('phut', String(rescueMinutes));
  if (!pauseNew) params.set('giuTuMoi', 'true');
  const qs = params.toString();

  const { data: plan, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['learning-today', rescueMinutes, pauseNew],
    queryFn: () => apiFetch(`/api/v1/learning/today${qs ? `?${qs}` : ''}`),
    placeholderData: (prev) => prev
  });

  const { data: activity } = useQuery({
    queryKey: ['statistics-overview-week', plan?.ngay],
    queryFn: () => apiFetch(`/api/v1/statistics/overview?tuNgay=${addDays(plan.ngay, -6)}&denNgay=${plan.ngay}`),
    enabled: !!plan?.ngay,
    retry: false
  });

  const sessionMutation = useMutation({
    mutationFn: (body) => apiFetch('/api/v1/learning/sessions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (res) => router.push(`/hoc-phien?id=${res.id}`)
  });

  const finishMutation = useMutation({
    mutationFn: (id) => apiFetch(`/api/v1/learning/sessions/${id}/finish`, { method: 'POST' }),
    onSuccess: (_, id) => router.push(`/hoc-tong-ket?id=${id}`)
  });

  const chosenMinutes = minutes ?? nearest(plan?.phutMoiNgay || 10);

  const handleStart = (e) => {
    e.preventDefault();
    sessionMutation.mutate({ boTheId: null, chieuHoc, quyThoiGian: Number(chosenMinutes) });
  };

  const todayStr = plan?.ngay ? plan.ngay.split('-').reverse().join('/') : '';
  const totalCardsToday = (plan?.soQuaHan || 0) + (plan?.soDenHan || 0) + (plan?.soMoiConLai || 0);
  const rescue = plan?.cuuLichOn || null;
  const resumeOpen = !!(plan?.phienDangDo && plan.phienDangDo.soChuaTraLoi > 0);
  const spent = plan?.daHocHomNay?.thoiGian || 0;
  const goalMs = (plan?.phutMoiNgay || 10) * 60000;
  const startError = errorText(sessionMutation.error, 'Chưa bắt đầu được phiên học. Hãy thử lại.');

  return (
    <div className="page page-grid with-side today-page" data-view={isLoading ? 'loading' : error && !plan ? 'error' : 'ready'}>
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

      {error && !plan && (
        <section className="sheet" data-when="error">
          <ErrorState title="Chưa tải được kế hoạch học" description={error.message} onRetry={refetch} />
        </section>
      )}

      {!isLoading && plan?.tongSoThe === 0 && (
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

      {!isLoading && plan?.tongSoThe > 0 && (
        <>
          <section className="sheet" data-when="ready" aria-labelledby="page-title">
            <div className="form-head">
              <div className="form-code"><span>Hôm nay</span><span>{todayStr}</span></div>
              <h1 id="page-title" tabIndex={-1}>Hôm nay học gì?</h1>
              <p id="lead">
                {rescue
                  ? 'Bạn nghỉ một thời gian nên có nhiều thẻ trễ hạn. Không cần ôn hết trong một ngày.'
                  : totalCardsToday === 0
                    ? 'Không còn thẻ nào cần học hôm nay.'
                    : `Có ${(plan.soQuaHan || 0) + (plan.soDenHan || 0)} thẻ cần ôn và ${plan.soMoiConLai || 0} từ mới, cần khoảng ${plan.uocTinhPhut || 0} phút (ước tính).`}
              </p>
            </div>

            <ResumeBlock
              session={plan.phienDangDo}
              onFinish={(id) => finishMutation.mutate(id)}
              finishing={finishMutation.isPending}
              finishError={errorText(finishMutation.error, 'Chưa kết thúc được phiên. Hãy thử lại.')}
            />

            {rescue ? (
              <RescueBlock
                rescue={rescue}
                giayMoiLuot={plan.giayMoiLuot}
                rescueMinutes={rescueMinutes}
                setRescueMinutes={setRescueMinutes}
                pauseNew={pauseNew}
                setPauseNew={setPauseNew}
                onStart={(body) => sessionMutation.mutate(body)}
                starting={sessionMutation.isPending}
                startError={startError}
                refreshing={isFetching}
              />
            ) : (
              <div id="normal">
                {error && <p className="notice notice-danger" role="alert">{errorText(error, 'Chưa tải lại được kế hoạch.')}</p>}
                {sessionMutation.error && (
                  <p className="notice notice-danger study-error" role="alert" style={{ marginBottom: 'var(--space-4)' }}>{startError}</p>
                )}

                <dl className="tally cols-2" id="tally">
                  <div>
                    <dt>Quá hạn<small>trễ từ hôm trước</small></dt>
                    <dd><span className="tally-n">{plan.soQuaHan || 0}</span>thẻ</dd>
                  </div>
                  <div>
                    <dt>Đến hạn hôm nay</dt>
                    <dd><span className="tally-n">{plan.soDenHan || 0}</span>thẻ</dd>
                  </div>
                  <div>
                    <dt>Từ mới còn lại<small>đã học {plan.soTheMoiDaHoc || 0}/{plan.tuMoiMoiNgay || 0} từ mới hôm nay</small></dt>
                    <dd><span className="tally-n">{plan.soMoiConLai || 0}</span>từ</dd>
                  </div>
                  <div>
                    <dt>Thời gian cần<small>ước tính {plan.giayMoiLuot || 20} giây mỗi lượt</small></dt>
                    <dd><span className="tally-n">{plan.uocTinhPhut || 0}</span>phút</dd>
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
                        {MINUTE_OPTIONS.map((v) => (
                          <label key={v} className="choice choice-card">
                            <input type="radio" name="minutes" value={v} checked={chosenMinutes === v} onChange={() => setMinutes(v)} />
                            <span className="bubble" aria-hidden="true"></span>
                            <span className="choice-body">
                              <span className="choice-title">{v} phút</span>
                              <span className="choice-desc">khoảng {Math.floor((v * 60) / (plan.giayMoiLuot || 20))} lượt</span>
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

                    <div className={`${styles.startFoot} start-foot`} style={{ marginTop: 'var(--space-6)' }}>
                      <Button type="submit" variant={resumeOpen ? 'secondary' : 'accent'} size="lg" disabled={sessionMutation.isPending}>
                        {sessionMutation.isPending ? 'Đang tạo phiên…' : resumeOpen ? 'Bắt đầu phiên mới' : 'Bắt đầu phiên hôm nay'}
                      </Button>
                      <Link className="btn btn-quiet" href="/hoc">Tự chọn bộ và thời gian</Link>
                    </div>
                  </form>
                )}
              </div>
            )}

            <WeekBlock plan={plan} activity={activity} />
          </section>

          <aside className="side-col" data-when="ready">
            <section className="panel" aria-labelledby="streak-title">
              <h2 className="panel-title" id="streak-title">Chuỗi ngày học</h2>
              <p className={styles.streak}>
                <span className="tally-n">{plan.chuoiNgay || 0}</span>
                <span>ngày liên tiếp</span>
              </p>
              <p className="small muted">
                {plan.homNayDaTinhChuoi ? 'Hôm nay đã được tính. ' : 'Hôm nay chưa được tính. '}
                Một ngày được tính khi bạn có ít nhất {plan.luotToiThieuChuoi || 5} lượt ôn trong ngày, không cần kết thúc phiên.
              </p>
            </section>

            <section className="panel" aria-labelledby="goal-title">
              <h2 className="panel-title" id="goal-title">Mục tiêu mỗi ngày</h2>
              <p className={styles.goalLine}>
                <span>Đã học {plan.daHocHomNay?.soLuot || 0} lượt hôm nay</span>
                <span className="num">{plan.daHocHomNay?.soPhut || 0}/{plan.phutMoiNgay || 10} phút</span>
              </p>
              <div
                className="meter is-progress"
                role="img"
                aria-label={`Đã học ${plan.daHocHomNay?.soPhut || 0} trên ${plan.phutMoiNgay || 10} phút mục tiêu`}
                style={{ '--v': Math.min(1, spent / goalMs) }}
              >
                <span></span>
              </div>
              <p className="small muted" style={{ marginTop: 'var(--sp-2)' }}>
                {spent >= goalMs
                  ? 'Đã đạt mục tiêu hôm nay.'
                  : `Còn khoảng ${Math.ceil((goalMs - spent) / 60000)} phút để đạt mục tiêu. Thời gian tính từ lúc trả lời thẻ và làm bài luyện.`}
              </p>
              <Link className="btn btn-quiet" href="/ca-nhan/hoc-tap" style={{ margin: 'var(--sp-2) 0 0 -12px' }}>
                Đổi thiết lập học
              </Link>
            </section>

            {plan.boThe && plan.boThe.length > 0 && (
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
                        <Link className="btn btn-secondary btn-sm" href={`/hoc?boTheId=${b.boTheId}`}>Học bộ này</Link>
                        <Link className="btn btn-quiet btn-sm" href={`/bo-the/${b.boTheId}/tien-do`}>Tiến độ</Link>
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
