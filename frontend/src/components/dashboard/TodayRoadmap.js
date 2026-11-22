'use client';
import Link from 'next/link';
import { Icon } from '@/components/ui';
import styles from './TodayRoadmap.module.css';

const fmtDay = ymd => (ymd ? `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}` : '');
const minutesFor = (count, seconds) => Math.max(1, Math.ceil((count * (seconds || 20)) / 60));

function MoreToStudy({ plan, onStart, starting, chieuHoc, emphasize }) {
  const other = chieuHoc === 'EN_VI' ? 'VI_EN' : 'EN_VI';
  const otherLabel = other === 'VI_EN' ? 'Việt → Anh' : 'Anh → Việt';
  const decks = (plan.boThe || []).filter(deck => deck.soCanOn > 0 || deck.soMoi > 0).slice(0, 3);
  const newLeft = plan.soMoiConLai || 0;
  return (
    <div className={styles.more} data-emphasize={emphasize || undefined}>
      <p className={styles.moreTitle}>{emphasize ? 'Học thêm ngay' : 'Muốn học nhiều hơn?'}</p>
      <ul className={styles.moreGrid} role="list">
        {onStart && (
          <li>
            <button type="button" className={styles.moreItem} disabled={starting} onClick={() => onStart({ boTheId: null, chieuHoc: other, quyThoiGian: 10 })}>
              <Icon name="refresh" />
              <span><b>Học chiều {otherLabel}</b><small>Chiều này có lịch ôn riêng, thường vẫn còn thẻ.</small></span>
            </button>
          </li>
        )}
        {decks.map(deck => (
          <li key={deck.boTheId}>
            <Link className={styles.moreItem} href={`/hoc?boTheId=${encodeURIComponent(deck.boTheId)}`}>
              <Icon name="decks" />
              <span><b>{deck.ten}</b><small>{deck.soCanOn} thẻ cần ôn · {deck.soMoi} từ chưa học</small></span>
            </Link>
          </li>
        ))}
        <li>
          <Link className={styles.moreItem} href="/luyen-tap">
            <Icon name="practice" />
            <span><b>Luyện tập</b><small>Chọn nghĩa, nghe viết, điền từ. Không ảnh hưởng lịch ôn.</small></span>
          </Link>
        </li>
        <li>
          <Link className={styles.moreItem} href="/so-tay">
            <Icon name="notebook" />
            <span><b>Sổ tay từ khó</b><small>Xem lại các từ bạn hay chọn Quên.</small></span>
          </Link>
        </li>
        {newLeft === 0 && (
          <li>
            <Link className={styles.moreItem} href="/ca-nhan/hoc-tap">
              <Icon name="plus" />
              <span><b>Tăng từ mới mỗi ngày</b><small>Đang là {plan.tuMoiMoiNgay || 0} từ. Tăng nhẹ để có thêm thẻ học.</small></span>
            </Link>
          </li>
        )}
        <li>
          <Link className={styles.moreItem} href="/thu-vien">
            <Icon name="library" />
            <span><b>Thêm bộ mới</b><small>Sao chép một bộ trong thư viện để có từ mới học ngay.</small></span>
          </Link>
        </li>
      </ul>
    </div>
  );
}

function nextReview(plan) {
  const forecast = Array.isArray(plan.duBaoOn) ? plan.duBaoOn : [];
  const index = forecast.findIndex(day => day.soCanOn > 0);
  if (index < 0) return null;
  const day = forecast[index];
  const diff = Math.round((Date.parse(day.ngay) - Date.parse(plan.ngay)) / 86400000);
  const when = diff <= 1 ? 'Ngày mai' : `${diff} ngày nữa`;
  return { when, date: fmtDay(day.ngay), count: day.soCanOn };
}

export function TodayRoadmap({ plan, onStart, starting = false, chieuHoc = 'EN_VI' }) {
  const seconds = plan.giayMoiLuot || 20;
  const resume = plan.phienDangDo && plan.phienDangDo.soChuaTraLoi > 0 ? plan.phienDangDo : null;
  const steps = [
    { key: 'overdue', icon: 'alert', title: 'Ôn thẻ quá hạn', count: plan.soQuaHan || 0, unit: 'thẻ', why: 'Trễ hạn càng lâu càng dễ quên hẳn, nên ôn đầu tiên.' },
    { key: 'due', icon: 'clock', title: 'Ôn thẻ đến hạn hôm nay', count: plan.soDenHan || 0, unit: 'thẻ', why: 'Đúng lúc sắp quên, ôn bây giờ nhớ lâu nhất.' },
    { key: 'new', icon: 'plus', title: 'Học từ mới', count: plan.soMoiConLai || 0, unit: 'từ', why: `Làm sau cùng. Mỗi ngày tối đa ${plan.tuMoiMoiNgay || 0} từ để không dồn bài ôn về sau.` }
  ];
  const currentIndex = steps.findIndex(step => step.count > 0);
  const next = nextReview(plan);
  const totalMinutes = steps.reduce((sum, step) => sum + (step.count ? minutesFor(step.count, seconds) : 0), 0);

  return (
    <section className={styles.roadmap} aria-labelledby="roadmap-title">
      <div className={styles.head}>
        <h2 id="roadmap-title">Lộ trình hôm nay</h2>
        <span className={styles.total}>{currentIndex < 0 ? 'Đã xong' : `khoảng ${totalMinutes} phút`}</span>
      </div>

      {resume && currentIndex >= 0 && (
        <p className={styles.resumeNote}>
          <Icon name="play" />
          <span>Bạn có phiên đang dở còn {resume.soChuaTraLoi} thẻ. Bấm <Link href={`/hoc-phien?id=${resume.id}`}>Tiếp tục phiên</Link> là đi đúng thứ tự dưới đây.</span>
        </p>
      )}

      <ol className={styles.steps} role="list">
        {steps.map((step, index) => {
          const state = step.count === 0 ? 'done' : index === currentIndex ? 'now' : 'later';
          return (
            <li key={step.key} className={styles.step} data-state={state}>
              <span className={styles.mark} aria-hidden="true">{state === 'done' ? <Icon name="check" /> : index + 1}</span>
              <div className={styles.body}>
                <p className={styles.title}>
                  {step.title}
                  {state === 'now' && <span className={styles.badge}>Làm trước</span>}
                  {state === 'done' && <span className={styles.doneTag}>Xong</span>}
                </p>
                <p className={styles.why}>{state === 'done' ? 'Không còn gì ở bước này.' : step.why}</p>
              </div>
              <div className={styles.side}>
                {step.count > 0 && <span className={styles.count}><b>{step.count}</b> {step.unit}</span>}
                {step.count > 0 && <span className={styles.time}>~{minutesFor(step.count, seconds)} phút</span>}
              </div>
            </li>
          );
        })}
      </ol>

      <div className={styles.next}>
        <Icon name="calendar" />
        <p>
          {currentIndex >= 0
            ? <><strong>Làm ngay bây giờ.</strong> {next ? <>Sau đó lịch ôn tự hẹn kế tiếp là <b>{next.when.toLowerCase()} ({next.date})</b>, {next.count} thẻ.</> : 'Thẻ vừa ôn sẽ được hẹn vào lịch sau khi bạn chấm.'}</>
            : next ? <><strong>Lịch ôn tự hẹn kế tiếp: {next.when.toLowerCase()} ({next.date})</strong>, {next.count} thẻ. Không cần chờ: bạn vẫn học thêm được ngay bên dưới.</> : <><strong>Chưa có thẻ nào đến hạn.</strong> Bạn vẫn học thêm được ngay bên dưới.</>}
          {' '}<a href="#schedule-title">Xem từng từ và giờ ôn</a>
        </p>
      </div>

      <MoreToStudy plan={plan} onStart={onStart} starting={starting} chieuHoc={chieuHoc} emphasize={currentIndex < 0} />

      <details className={styles.howto}>
        <summary><Icon name="info" />Cách ôn dễ nhất (3 bước)</summary>
        <ol role="list">
          <li><b>Nhìn mặt trước, tự nhớ trong đầu</b> trước khi lật. Cố nhớ vài giây là phần giúp nhớ lâu.</li>
          <li><b>Lật thẻ và chấm thật lòng:</b> <span className={styles.rate}>Quên</span> không nhớ ra, <span className={styles.rate}>Khó</span> nhớ chậm hoặc sai một phần, <span className={styles.rate}>Nhớ</span> nhớ đúng, <span className={styles.rate}>Dễ</span> nhớ ngay.</li>
          <li><b>Để hệ thống hẹn lần sau.</b> Thẻ quên sẽ quay lại sớm, thẻ dễ giãn dần. Mỗi ngày quay lại vài phút là đủ.</li>
        </ol>
      </details>
    </section>
  );
}
