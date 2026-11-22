'use client';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { continuePath, isTourActive, LIBRARY_PATH, missionStates, tourSignal } from '@/lib/onboarding-tour.mjs';
import styles from './OnboardingChecklist.module.css';

export function OnboardingChecklist() {
  const router = useRouter();
  const { tour, advance } = useOnboardingTour();
  const step = tour?.buocHuongDan;
  if (!isTourActive(step)) return null;

  const missions = missionStates(step);
  const done = missions.filter(mission => mission.status === 'done').length;

  const resume = () => {
    tourSignal('resume');
    if (step === 'XEM_TONG_KET') {
      advance.mutate({ buocHuongDan: 'SAO_CHEP_THU_VIEN' }, { onSuccess: () => router.push(LIBRARY_PATH) });
      return;
    }
    const path = continuePath(tour);
    if (path !== '/hom-nay') router.push(path);
  };

  const skip = () => {
    if (!window.confirm('Bỏ hướng dẫn? Bạn có thể xem lại trong Thiết lập học.')) return;
    advance.mutate({ buocHuongDan: 'BO_QUA' });
  };

  return (
    <section className={styles.card} aria-labelledby="tour-checklist-title">
      <div className={styles.head}>
        <p className={styles.code}><span>Nhiệm vụ đầu tiên</span><span>{done}/{missions.length}</span></p>
        <h2 id="tour-checklist-title" className={styles.title}>Làm quen cách học trong vài phút</h2>
      </div>
      <ol className={styles.list}>
        {missions.map((mission, index) => (
          <li key={mission.key} className={styles.item} data-state={mission.status}>
            <span className={styles.bubble} aria-hidden="true">
              {mission.status === 'done' ? <Icon name="check" /> : index + 1}
            </span>
            <span className={styles.text}>
              <span className={styles.itemTitle}>{mission.title}</span>
              <span className={styles.itemDesc}>{mission.desc}</span>
            </span>
            <span className="sr-only">{mission.status === 'done' ? 'Đã xong' : mission.status === 'current' ? 'Đang làm' : 'Chưa làm'}</span>
          </li>
        ))}
      </ol>
      <div className={styles.actions}>
        <button type="button" className="btn btn-accent btn-sm" onClick={resume} disabled={advance.isPending}>Tiếp tục hướng dẫn</button>
        <button type="button" className="btn btn-quiet btn-sm" onClick={skip} disabled={advance.isPending}>Bỏ hướng dẫn</button>
      </div>
    </section>
  );
}
