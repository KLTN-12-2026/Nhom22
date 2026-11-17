'use client';
import { ErrorState } from '@/components/ui';
export function RemoteState({ queries, children }) {
  const error = queries.find(q => q.isError);
  if (error) return <ErrorState description={error.error.message} onRetry={() => queries.forEach(q => q.refetch())} />;
  if (queries.some(q => q.isPending)) return <p role="status">Đang tải dữ liệu…</p>;
  return children;
}
export function EmptyData({ children = 'Chưa có dữ liệu.' }) { return <p className="notice" role="status">{children}</p>; }
export function PageSheet({ title, description, children }) { return <div className="page"><article className="sheet"><div className="form-head"><h1>{title}</h1><p>{description}</p></div>{children}</article></div>; }
