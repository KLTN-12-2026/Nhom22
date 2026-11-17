"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { money, statuses } from '@/lib/billing-api';
import { ErrorState } from '@/components/ui';
export default function PaymentResult() {
  const params = useSearchParams();
  const order = params.get('maDon');
  const client = useQueryClient();
  const result = useQuery({ queryKey: ['billing', 'result', order], enabled: !!order, queryFn: () => apiFetch(`/api/v1/billing/transactions/${encodeURIComponent(order)}`), refetchInterval: query => query.state.data?.trangThai === 'CHO_THANH_TOAN' ? 3000 : false });
  const status = result.data?.trangThai;
  useEffect(() => { if (status && status !== 'CHO_THANH_TOAN') { client.invalidateQueries({ queryKey: ['billing', 'subscription'] }); client.invalidateQueries({ queryKey: ['billing', 'history'] }); client.invalidateQueries({ queryKey: ['billing', 'admin'] }); } }, [status, client]);
  return <div className="page"><article className="sheet"><div className="form-head"><h1>Kết quả thanh toán</h1></div>
    {!order ? <p role="alert">Không tìm thấy mã đơn hoặc không xác minh được kết quả thanh toán.</p> : result.isPending ? <p role="status">Đang kiểm tra kết quả…</p> : result.isError ? <ErrorState description={result.error.message} onRetry={() => result.refetch()} /> : <><h2>{statuses[status]?.[0] || status}</h2><p>Đơn {order} · {result.data.tenGoi} · {money(result.data.soTien)}</p>{status === 'CHO_THANH_TOAN' && <p role="status">Đang chờ cổng thanh toán xác nhận…</p>}{status === 'THANH_CONG' && <p>Gói dịch vụ đã được cập nhật cho tài khoản.</p>}</>}
    <div className="row" style={{ marginTop: 'var(--sp-5)' }}><Link className="btn btn-primary" href={status === 'THANH_CONG' ? '/hom-nay' : '/thanh-toan-goi'}>{status === 'THANH_CONG' ? 'Học hôm nay' : 'Về gói dịch vụ'}</Link><Link className="btn btn-secondary" href="/thanh-toan-lich-su">Lịch sử thanh toán</Link></div>
  </article></div>;
}
