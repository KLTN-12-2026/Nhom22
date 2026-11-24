import { Suspense } from 'react';
import SupportTickets from './support-tickets';

export const metadata = {
  title: 'Phiếu hỗ trợ',
  description: 'Quản lý và theo dõi các yêu cầu hỗ trợ của học viên.',
};

export default function SupportTicketsPage() {
  return <Suspense fallback={<div className="page sheet" role="status">Đang tải phiếu hỗ trợ…</div>}>
    <SupportTickets />
  </Suspense>;
}
