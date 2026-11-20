import { Suspense } from 'react';
import PaymentResult from './result';
export const metadata = { title: 'Kết quả thanh toán' };
export default function Page() { return <Suspense fallback={<div className="page sheet">Đang tải kết quả…</div>}><PaymentResult /></Suspense>; }
