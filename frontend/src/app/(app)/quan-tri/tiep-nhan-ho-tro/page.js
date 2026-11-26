import { Suspense } from 'react';
import SupportIntake from './support-intake';

export const metadata = {
  title: 'Tiếp nhận hỗ trợ',
  description: 'Tiếp nhận, phản hồi và giải quyết phiếu hỗ trợ của học viên.',
};

export default function SupportIntakePage() {
  return <Suspense fallback={<div className="adm-card"><div className="adm-empty" role="status">Đang tải phiếu hỗ trợ…</div></div>}>
    <SupportIntake />
  </Suspense>;
}
