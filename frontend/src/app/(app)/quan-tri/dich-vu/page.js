'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ErrorState, Icon } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import { num } from '@/lib/admin-dashboard.mjs';
import { vietnamDate } from '@/lib/revenue.mjs';
import {
  QUOTA_MAX, REASON_MAX, SERVICE_INFO, SERVICE_TYPES, errorRate, quotaChanges, quotaInputError, quotaKey, quotaPlans,
  rangeDates, reasonError, updateQuotas, usageUrl,
} from '@/lib/admin-ops.mjs';

const RANGES = [1, 7, 30, 90];
const rangeLabel = days => (days === 1 ? 'Hôm nay' : `${days} ngày`);

function UsageCard() {
  const [days, setDays] = useState(7);
  const range = rangeDates(days, vietnamDate());
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-service-usage', range.tuNgay, range.denNgay],
    queryFn: () => apiFetch(usageUrl(range)),
    placeholderData: previous => previous,
  });
  const services = data?.dichVu || [];
  const max = Math.max(1, ...services.map(s => s.soLuotDung));

  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <h2>Sử dụng dịch vụ</h2>
        <span className="adm-sub">{data ? `${data.tuNgay} → ${data.denNgay} · ${data.muiGio}` : ''}</span>
        <div className="adm-card-actions">
          <div className="adm-seg" role="radiogroup" aria-label="Khoảng thời gian">
            {RANGES.map(value => <button key={value} type="button" role="radio" aria-checked={days === value} onClick={() => setDays(value)}>{rangeLabel(value)}</button>)}
          </div>
        </div>
      </div>
      {isLoading ? <div className="adm-empty" role="status">Đang tải lượt dùng…</div> : isError ? (
        <ErrorState title="Chưa tải được lượt dùng" description={error?.message} onRetry={() => refetch()} />
      ) : (
        <div className="adm-table-wrap" style={{ marginTop: 12 }}>
          <table className="adm-table">
            <thead><tr><th>Dịch vụ</th><th className="adm-num">Lượt dùng</th><th style={{ width: '22%' }}><span className="sr-only">Tỷ trọng</span></th><th className="adm-num">Đang giữ</th><th className="adm-num">Người dùng</th><th className="adm-num">Lỗi</th><th className="adm-num">Chưa rõ</th><th className="adm-num">Tỷ lệ lỗi</th></tr></thead>
            <tbody>
              {services.map(service => {
                const [name, desc] = SERVICE_INFO[service.loai] || [service.loai, ''];
                const rate = errorRate(service);
                return (
                  <tr key={service.loai}>
                    <td><b style={{ fontWeight: 500 }}>{name}</b><div className="adm-muted">{desc}</div></td>
                    <td className="adm-num">{num(service.soLuotDung)}</td>
                    <td style={{ verticalAlign: 'middle' }}><div style={{ height: 8, borderRadius: 99, background: 'var(--sunk)', border: '1px solid var(--line)', overflow: 'hidden' }}><div style={{ width: `${(service.soLuotDung / max) * 100}%`, height: '100%', background: 'var(--primary-fill)' }} /></div></td>
                    <td className="adm-num">{num(service.soDangGiu)}</td>
                    <td className="adm-num">{num(service.soNguoiDung)}</td>
                    <td className="adm-num">{service.soLoi == null ? <span className="adm-muted">Không ghi nhận</span> : num(service.soLoi)}</td>
                    <td className="adm-num">{service.soKhongXacDinh == null ? <span className="adm-muted">—</span> : num(service.soKhongXacDinh)}</td>
                    <td className="adm-num">{rate == null ? <span className="adm-muted">—</span> : <span className={`adm-pill adm-pill-${rate >= 5 ? 'bad' : rate > 0 ? 'warn' : 'ok'}`}>{num(rate)}%</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="adm-hint" style={{ padding: '8px 16px 14px' }}>“Đang giữ” là lượt đã trừ hạn mức nhưng yêu cầu chưa xong. Lỗi và chưa rõ kết quả chỉ ghi nhận cho Trợ lý AI và Ảnh thẻ AI.</p>
    </section>
  );
}

function QuotaCard() {
  const client = useQueryClient();
  const [draft, setDraft] = useState({});
  const [lyDo, setLyDo] = useState('');
  const [touched, setTouched] = useState(false);
  const [notice, setNotice] = useState(null);
  const { data: items = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-service-quotas'],
    queryFn: () => apiFetch('/api/v1/admin/service-quotas'),
  });
  const plans = useMemo(() => quotaPlans(items), [items]);
  const byKey = useMemo(() => Object.fromEntries(items.map(item => [quotaKey(item), item])), [items]);
  const changes = quotaChanges(items, draft);
  const cellErrors = Object.fromEntries(Object.entries(draft).map(([key, value]) => [key, quotaInputError(value)]).filter(([, msg]) => msg));
  const reasonMsg = reasonError(lyDo);

  const mutation = useMutation({
    mutationFn: () => updateQuotas(apiFetch, changes, lyDo),
    onSuccess: result => {
      client.setQueryData(['admin-service-quotas'], result);
      setNotice({ tone: 'ok', text: `Đã lưu ${changes.length} hạn mức. Thay đổi áp dụng ngay cho lượt dùng kế tiếp và đã ghi nhật ký.` });
      setDraft({});
      setLyDo('');
      setTouched(false);
    },
    onError: err => {
      if (err.status === 409) {
        refetch();
        setDraft({});
        setNotice({ tone: 'bad', text: 'Hạn mức vừa được người khác sửa. Bảng đã tải lại số mới, hãy nhập lại thay đổi.' });
      } else {
        setNotice({ tone: 'bad', text: err.message });
      }
    },
  });

  const save = event => {
    event.preventDefault();
    setTouched(true);
    setNotice(null);
    if (!changes.length || Object.keys(cellErrors).length || reasonMsg) return;
    mutation.mutate();
  };

  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <h2>Hạn mức mỗi ngày theo gói</h2>
        <span className="adm-sub">số lượt tối đa một người dùng được dùng trong một ngày</span>
        <div className="adm-card-actions"><Link className="adm-btn adm-btn-sm" href="/quan-tri/nhat-ky?loai=HAN_MUC_DICH_VU"><Icon name="clock" />Lịch sử sửa</Link></div>
      </div>
      {isLoading ? <div className="adm-empty" role="status">Đang tải hạn mức…</div> : isError ? (
        <ErrorState title="Chưa tải được hạn mức" description={error?.message} onRetry={() => refetch()} />
      ) : (
        <form onSubmit={save} noValidate>
          <div className="adm-table-wrap" style={{ marginTop: 12 }}>
            <table className="adm-table">
              <thead><tr><th>Dịch vụ</th>{plans.map(plan => <th key={plan} className="adm-num">Gói {plan}</th>)}</tr></thead>
              <tbody>
                {SERVICE_TYPES.map(loai => {
                  const [name, desc] = SERVICE_INFO[loai];
                  return (
                    <tr key={loai}>
                      <td><b style={{ fontWeight: 500 }}>{name}</b><div className="adm-muted">{desc}</div></td>
                      {plans.map(plan => {
                        const key = `${plan}:${loai}`;
                        const item = byKey[key];
                        if (!item) return <td key={plan} className="adm-num adm-muted">—</td>;
                        const value = draft[key] ?? String(item.soLuotNgay);
                        const changed = draft[key] !== undefined && Number(draft[key]) !== item.soLuotNgay;
                        const err = cellErrors[key];
                        return (
                          <td key={plan} className="adm-num" style={{ verticalAlign: 'middle' }}>
                            <label className="sr-only" htmlFor={`q-${key}`}>{name}, gói {plan}</label>
                            <input id={`q-${key}`} className="adm-input" type="number" inputMode="numeric" min={0} max={QUOTA_MAX} step={1} value={value}
                              aria-invalid={!!err} aria-describedby={err ? `q-${key}-err` : undefined}
                              onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))}
                              style={{ width: 110, textAlign: 'right', ...(changed ? { borderColor: 'var(--primary)', background: 'var(--primary-tint)' } : {}) }} />
                            {changed && !err && <div className="adm-muted">trước: {num(item.soLuotNgay)}</div>}
                            {err && <div id={`q-${key}-err`} className="adm-error">{err}</div>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="adm-card-body" style={{ borderTop: '1px solid var(--line)', display: 'grid', gap: 10 }}>
            <div>
              <label className="adm-label" htmlFor="quota-reason">Lý do thay đổi</label>
              <textarea id="quota-reason" className="adm-textarea" rows={2} value={lyDo} onChange={event => setLyDo(event.target.value)} aria-invalid={touched && !!reasonMsg} aria-describedby="quota-reason-hint" placeholder="Ví dụ: Tăng hạn mức AI cho đợt thi thử cuối tháng." />
              <p id="quota-reason-hint" className={touched && reasonMsg ? 'adm-error' : 'adm-hint'}>{touched && reasonMsg ? reasonMsg : `${lyDo.trim().length}/${REASON_MAX} ký tự · bắt buộc, ghi vào nhật ký quản trị.`}</p>
            </div>
            {touched && !changes.length && <p className="adm-error" role="alert">Chưa có ô nào thay đổi.</p>}
            {notice && <p className={`adm-notice adm-notice-${notice.tone}`} role={notice.tone === 'bad' ? 'alert' : 'status'}><Icon name={notice.tone === 'bad' ? 'alert' : 'check'} />{notice.text}</p>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <span className="adm-muted">{changes.length ? `${changes.length} ô đã sửa` : 'Sửa số trong bảng rồi lưu.'}</span>
              <button type="button" className="adm-btn" style={{ marginLeft: 'auto' }} disabled={!Object.keys(draft).length || mutation.isPending} onClick={() => { setDraft({}); setTouched(false); setNotice(null); }}>Hoàn tác</button>
              <button type="submit" className="adm-btn adm-btn-primary" disabled={mutation.isPending}>{mutation.isPending ? 'Đang lưu…' : 'Lưu hạn mức'}</button>
            </div>
          </div>
        </form>
      )}
    </section>
  );
}

export default function AdminServiceOpsPage() {
  return (
    <div className="adm-page">
      <div className="adm-head">
        <div>
          <h1>Dịch vụ & hạn mức</h1>
          <p>Theo dõi lượt dùng AI, ảnh, đọc và chấm phát âm; chỉnh hạn mức mỗi ngày cho từng gói. Hạn mức đặt riêng cho từng gói trả phí.</p>
        </div>
      </div>
      <UsageCard />
      <QuotaCard />
    </div>
  );
}
