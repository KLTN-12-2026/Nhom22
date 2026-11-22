'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import { aiPending } from '@/lib/remote-contract.mjs';
export function useAiRequest() {
  const [id, setId] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const client = useQueryClient();
  const query = useQuery({ queryKey: ['ai-request', id], enabled: !!id, queryFn: () => apiFetch(`/api/v1/ai/requests/${encodeURIComponent(id)}`), refetchInterval: q => aiPending(q.state.data?.trangThai) ? 5000 : false });
  async function start(path, body) {
    if (submitting || (id && (query.isPending || aiPending(query.data?.trangThai)))) return;
    setSubmitting(true); setError(''); setId(null);
    try { const result = await apiFetch(path, { method: 'POST', body: JSON.stringify(body) }); setId(result.requestId); client.invalidateQueries({ queryKey: ['service-quota'] }); }
    catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  }
  return { id, data: query.data, busy: submitting || (!!id && (query.isPending || aiPending(query.data?.trangThai))), error: error || query.error?.message || (['LOI', 'KHONG_XAC_DINH'].includes(query.data?.trangThai) ? `Yêu cầu ${query.data.trangThai}: ${query.data.maLoi || 'Vui lòng kiểm tra lịch sử trước khi gửi lại.'}` : ''), start, resume: setId, refetch: query.refetch };
}
