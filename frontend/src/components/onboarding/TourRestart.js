'use client';
import { useRouter } from 'next/navigation';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { isTourActive, tourSignal } from '@/lib/onboarding-tour.mjs';

export function TourRestart() {
  const router = useRouter();
  const { tour, start } = useOnboardingTour();
  if (!tour) return null;
  const running = isTourActive(tour.buocHuongDan);

  const restart = () => start.mutate(undefined, {
    onSuccess: () => {
      tourSignal('restart');
      router.push('/hom-nay');
    }
  });

  return (
    <section className="panel" aria-labelledby="tour-restart-title" style={{ marginBottom: 'var(--sp-5)' }}>
      <h2 className="panel-title" id="tour-restart-title">Hướng dẫn cho người mới</h2>
      <p className="small muted">
        {running
          ? 'Bạn đang làm dở 4 nhiệm vụ đầu tiên. Chạy lại sẽ bắt đầu từ nhiệm vụ học bộ khởi động.'
          : 'Đi lại 4 nhiệm vụ đầu tiên: học bộ khởi động, hiểu lịch ôn, sao chép bộ trong thư viện và thêm từ của bạn.'}
      </p>
      <button type="button" className="btn btn-secondary btn-sm" onClick={restart} disabled={start.isPending} aria-busy={start.isPending}>
        {start.isPending ? 'Đang chuẩn bị…' : 'Xem lại hướng dẫn'}
      </button>
      {start.error && <p className="notice notice-danger" role="alert">{start.error.message}</p>}
    </section>
  );
}
